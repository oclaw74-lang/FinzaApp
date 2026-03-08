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


def list_categorias(user_jwt: str, tipo: str | None = None) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("categorias")
            .select("*")
            .is_("deleted_at", "null")
            .order("nombre")
        )
        if tipo:
            query = query.eq("tipo", tipo)
        response = query.execute()
        return response.data
    except APIError as e:
        _handle_api_error(e)


def get_categoria(user_jwt: str, categoria_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("categorias")
            .select("*")
            .eq("id", categoria_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        return response.data
    except APIError as e:
        _handle_api_error(e)


def create_categoria(user_jwt: str, user_id: str, data: dict) -> dict:
    client = get_user_client(user_jwt)
    payload = {**data, "user_id": user_id}
    try:
        response = client.table("categorias").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Categoria no encontrada tras insercion.")
    except APIError as e:
        _handle_api_error(e)


def update_categoria(user_jwt: str, categoria_id: str, data: dict) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("categorias").update(data).eq("id", categoria_id).execute()
        )
        return response.data[0] if response.data else None
    except IndexError:
        raise HTTPException(status_code=404, detail="Categoria no encontrada.")
    except APIError as e:
        _handle_api_error(e)


def delete_categoria(user_jwt: str, user_id: str, categoria_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("categorias")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", categoria_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Categoria no encontrada.")
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Categoria no encontrada.")
    except APIError as e:
        _handle_api_error(e)
