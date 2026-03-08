from datetime import datetime, timezone

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client


def _handle_api_error(e: APIError) -> None:
    code = e.code or ""
    # Postgres SQLSTATE: 23505 = unique_violation, 23503 = foreign_key_violation
    if code == "23505":
        raise HTTPException(status_code=409, detail=str(e.message))
    if code == "23503":
        raise HTTPException(status_code=400, detail=str(e.message))
    try:
        status = int(code)
    except (ValueError, TypeError):
        raise HTTPException(status_code=500, detail="Error interno del servidor.")
    if status == 400:
        raise HTTPException(status_code=400, detail=str(e.message))
    if status == 404:
        raise HTTPException(status_code=404, detail=str(e.message))
    if status == 409:
        raise HTTPException(status_code=409, detail=str(e.message))
    raise HTTPException(status_code=500, detail="Error interno del servidor.")


def list_egresos(
    user_jwt: str,
    user_id: str,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    categoria_id: str | None = None,
    moneda: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("egresos")
            .select("*, categorias(nombre, color, icono)", count="exact")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
        )
        if fecha_desde:
            query = query.gte("fecha", fecha_desde)
        if fecha_hasta:
            query = query.lte("fecha", fecha_hasta)
        if categoria_id:
            query = query.eq("categoria_id", categoria_id)
        if moneda:
            query = query.eq("moneda", moneda)

        offset = (page - 1) * page_size
        query = query.order("fecha", desc=True).range(offset, offset + page_size - 1)
        response = query.execute()

        total = response.count or 0
        return {
            "items": response.data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_next": (page * page_size) < total,
        }
    except APIError as e:
        _handle_api_error(e)


def get_egreso(user_jwt: str, egreso_id: str, user_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("egresos")
            .select("*")
            .eq("id", egreso_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        return response.data
    except APIError as e:
        _handle_api_error(e)


def create_egreso(user_jwt: str, user_id: str, data: dict) -> dict:
    client = get_user_client(user_jwt)
    payload = {**data, "user_id": user_id}
    try:
        response = client.table("egresos").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Egreso no encontrado tras insercion.")
    except APIError as e:
        _handle_api_error(e)


def update_egreso(
    user_jwt: str, egreso_id: str, user_id: str, data: dict
) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("egresos")
            .update(data)
            .eq("id", egreso_id)
            .eq("user_id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None
    except IndexError:
        raise HTTPException(status_code=404, detail="Egreso no encontrado.")
    except APIError as e:
        _handle_api_error(e)


def delete_egreso(user_jwt: str, egreso_id: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("egresos")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", egreso_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Egreso no encontrado.")
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Egreso no encontrado.")
    except APIError as e:
        _handle_api_error(e)
