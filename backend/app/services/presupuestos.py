import calendar
from uuid import UUID

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.presupuesto import PresupuestoCreate, PresupuestoUpdate
from app.services.base import _handle_api_error


def get_presupuestos(
    user_jwt: str,
    mes: int | None = None,
    year: int | None = None,
) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("presupuestos")
            .select("*, categorias(nombre)")
            .order("created_at", desc=True)
        )
        if mes is not None:
            query = query.eq("mes", mes)
        if year is not None:
            query = query.eq("year", year)

        response = query.execute()
        return response.data or []
    except APIError as e:
        _handle_api_error(e)
    return []


def get_presupuesto_by_id(user_jwt: str, presupuesto_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("presupuestos")
            .select("*, categorias(nombre)")
            .eq("id", presupuesto_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
        return response.data
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def create_presupuesto(user_jwt: str, user_id: str, data: PresupuestoCreate) -> dict:
    client = get_user_client(user_jwt)

    if data.aplicar_todos_los_meses:
        # Insert one record per month for the given year, skipping existing ones
        created_for_current_month: dict = {}
        for mes_num in range(1, 13):
            payload = {
                "user_id": user_id,
                "categoria_id": str(data.categoria_id),
                "mes": mes_num,
                "year": data.year,
                "monto_limite": data.monto_limite,
            }
            try:
                resp = client.table("presupuestos").insert(payload).execute()
                if resp.data and mes_num == data.mes:
                    created_for_current_month = resp.data[0]
            except APIError as e:
                code = e.code or ""
                # 23505 = unique_violation: skip this month, already exists
                if code == "23505" or "unique" in str(e.message).lower():
                    continue
                _handle_api_error(e)
        if created_for_current_month:
            return created_for_current_month
        # All months already existed or current month was among them — return any
        try:
            existing = (
                client.table("presupuestos")
                .select("*")
                .eq("user_id", user_id)
                .eq("categoria_id", str(data.categoria_id))
                .eq("mes", data.mes)
                .eq("year", data.year)
                .maybe_single()
                .execute()
            )
            return existing.data or {}
        except APIError:
            return {}

    payload = {
        "user_id": user_id,
        "categoria_id": str(data.categoria_id),
        "mes": data.mes,
        "year": data.year,
        "monto_limite": data.monto_limite,
    }
    try:
        response = client.table("presupuestos").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(
            status_code=500, detail="Presupuesto no encontrado tras insercion."
        )
    except APIError as e:
        # 23505 = unique_violation — detectado en _handle_api_error pero lo
        # gestionamos aqui para dar un mensaje mas descriptivo
        code = e.code or ""
        if code == "23505" or "unique" in str(e.message).lower():
            raise HTTPException(
                status_code=409,
                detail="Ya existe un presupuesto para esa categoria en ese mes/año.",
            )
        _handle_api_error(e)
    return {}


def update_presupuesto(
    user_jwt: str, presupuesto_id: str, data: PresupuestoUpdate
) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("presupuestos")
            .update({"monto_limite": data.monto_limite})
            .eq("id", presupuesto_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
        return response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def delete_presupuesto(user_jwt: str, presupuesto_id: str) -> None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("presupuestos")
            .delete()
            .eq("id", presupuesto_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Presupuesto no encontrado.")
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)


def get_sugeridos(user_jwt: str, user_id: str, mes: int, year: int) -> list[dict]:
    """
    Returns suggested budget limits for the target month/year.
    Algorithm:
    1. Find the last 3 calendar months BEFORE the target month
    2. For each category that has egresos in those 3 months, compute average monthly spend
    3. Suggest limit = round(avg * 1.10, -1)  # 10% buffer, rounded to nearest 10
    4. Skip categories that already have a presupuesto for the target mes/year
    5. Return list sorted by suggested amount desc
    """
    from calendar import monthrange
    from collections import defaultdict
    from datetime import datetime

    client = get_user_client(user_jwt)

    # Compute last 3 months before target
    meses_ref: list[tuple[int, int]] = []
    m, y = mes, year
    for _ in range(3):
        m -= 1
        if m == 0:
            m = 12
            y -= 1
        meses_ref.append((y, m))

    oldest_y, oldest_m = meses_ref[-1]
    newest_y, newest_m = meses_ref[0]
    fecha_inicio = f"{oldest_y}-{oldest_m:02d}-01"
    last_day = monthrange(newest_y, newest_m)[1]
    fecha_fin = f"{newest_y}-{newest_m:02d}-{last_day:02d}"

    # Fetch egresos in range
    try:
        eg_r = (
            client.table("egresos")
            .select("monto,categoria_id,fecha")
            .eq("user_id", user_id)
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
            .execute()
        )
    except APIError:
        return []

    # Fetch categories
    try:
        cat_r = client.table("categorias").select("id,nombre").execute()
    except APIError:
        return []

    cat_map = {c["id"]: c["nombre"] for c in (cat_r.data or [])}

    # Group by category, by month
    meses_set = set(meses_ref)
    totales: dict[str, dict[tuple[int, int], float]] = defaultdict(
        lambda: defaultdict(float)
    )

    for e in eg_r.data or []:
        cat_id = e.get("categoria_id")
        fecha_str = e.get("fecha", "")[:10]
        if not cat_id or not fecha_str:
            continue
        d = datetime.strptime(fecha_str, "%Y-%m-%d")
        key = (d.year, d.month)
        if key in meses_set:
            totales[cat_id][key] += float(e["monto"])

    # Fetch existing presupuestos for target month to exclude
    try:
        existing_r = (
            client.table("presupuestos")
            .select("categoria_id")
            .eq("user_id", user_id)
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
    except APIError:
        existing_r = type("_R", (), {"data": []})()

    existing_cats = {p["categoria_id"] for p in (existing_r.data or [])}

    # Build suggestions
    suggestions = []
    for cat_id, monthly_totals in totales.items():
        if cat_id in existing_cats:
            continue
        avg = sum(monthly_totals.values()) / 3  # divide by 3 months always
        suggested = round(avg * 1.10 / 10) * 10  # 10% buffer, round to nearest 10
        if suggested <= 0:
            continue
        suggestions.append(
            {
                "categoria_id": cat_id,
                "categoria_nombre": cat_map.get(cat_id, "Sin categoría"),
                "promedio_mensual": round(avg, 2),
                "sugerido": float(suggested),
                "mes": mes,
                "year": year,
            }
        )

    suggestions.sort(key=lambda x: x["sugerido"], reverse=True)
    return suggestions


def get_estado_presupuestos(user_jwt: str, mes: int, year: int) -> list[dict]:
    """Retorna presupuestos del mes con gasto_actual calculado desde egresos.

    Uses 2 queries total regardless of how many budgets the user has,
    replacing the previous N+1 pattern (1 per presupuesto).
    """
    from collections import defaultdict

    client = get_user_client(user_jwt)
    try:
        presupuestos_response = (
            client.table("presupuestos")
            .select("*, categorias(nombre)")
            .eq("mes", mes)
            .eq("year", year)
            .execute()
        )
        presupuestos = presupuestos_response.data or []
        if not presupuestos:
            return []

        last_day = calendar.monthrange(year, mes)[1]
        fecha_inicio = f"{year}-{mes:02d}-01"
        fecha_fin = f"{year}-{mes:02d}-{last_day:02d}"

        # Single query for all egresos in the month (RLS scopes to current user)
        egresos_response = (
            client.table("egresos")
            .select("categoria_id,monto")
            .gte("fecha", fecha_inicio)
            .lte("fecha", fecha_fin)
            .execute()
        )

        # Aggregate by categoria_id in Python — O(egresos) instead of O(N * queries)
        gastos: dict[str, float] = defaultdict(float)
        for e in egresos_response.data or []:
            cat_id = e.get("categoria_id")
            if cat_id:
                gastos[cat_id] += float(e["monto"])

        resultado = []
        for p in presupuestos:
            gasto_actual = round(gastos.get(p["categoria_id"], 0.0), 2)
            monto_limite = float(p["monto_limite"])
            porcentaje = (
                round(gasto_actual / monto_limite * 100, 2) if monto_limite > 0 else 0.0
            )
            categorias_data = p.get("categorias")
            categoria_nombre = (
                categorias_data.get("nombre", "")
                if isinstance(categorias_data, dict)
                else ""
            )

            resultado.append(
                {
                    "id": p["id"],
                    "categoria_id": p["categoria_id"],
                    "categoria_nombre": categoria_nombre,
                    "mes": p["mes"],
                    "year": p["year"],
                    "monto_limite": monto_limite,
                    "gasto_actual": gasto_actual,
                    "porcentaje_usado": porcentaje,
                    "alerta": porcentaje >= 80,
                }
            )

        return resultado
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return []
