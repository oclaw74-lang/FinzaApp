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


def create_presupuesto(user_jwt: str, data: PresupuestoCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = {
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
