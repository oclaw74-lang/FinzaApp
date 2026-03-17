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
    """Retorna presupuestos del mes con gasto_actual calculado desde egresos."""
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

        last_day = calendar.monthrange(year, mes)[1]
        fecha_inicio = f"{year}-{mes:02d}-01"
        fecha_fin = f"{year}-{mes:02d}-{last_day:02d}"

        resultado = []
        for p in presupuestos:
            egresos_response = (
                client.table("egresos")
                .select("monto")
                .eq("categoria_id", p["categoria_id"])
                .gte("fecha", fecha_inicio)
                .lte("fecha", fecha_fin)
                .execute()
            )
            gasto_actual = sum(
                float(e["monto"]) for e in (egresos_response.data or [])
            )
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
                    "gasto_actual": round(gasto_actual, 2),
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
