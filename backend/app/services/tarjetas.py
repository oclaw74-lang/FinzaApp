from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.tarjeta import TarjetaCreate, TarjetaUpdate
from app.services.base import _handle_api_error


def _enrich_tarjeta(row: dict) -> dict:
    """Add computed field 'disponible' for credit cards."""
    if row.get("tipo") == "credito" and row.get("limite_credito") is not None:
        limite = float(row["limite_credito"])
        saldo = float(row.get("saldo_actual") or 0)
        row["disponible"] = round(limite - saldo, 2)
    else:
        row["disponible"] = None
    return row


def get_tarjetas(user_jwt: str, user_id: str) -> list[dict]:
    """Return all active tarjetas for the authenticated user."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("tarjetas")
            .select("*")
            .eq("user_id", user_id)
            .eq("activa", True)
            .order("created_at", desc=True)
            .execute()
        )
        return [_enrich_tarjeta(row) for row in (response.data or [])]
    except APIError as e:
        _handle_api_error(e)
    return []


def get_tarjeta(user_jwt: str, user_id: str, tarjeta_id: str) -> dict | None:
    """Return a single tarjeta by ID, scoped to the authenticated user."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("tarjetas")
            .select("*")
            .eq("id", tarjeta_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            return None
        return _enrich_tarjeta(response.data)
    except APIError as e:
        _handle_api_error(e)
    return None


def create_tarjeta(
    user_jwt: str, user_id: str, data: TarjetaCreate, user_email: str | None = None
) -> dict:
    """Insert a new tarjeta and return the created record."""
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_none=True)
    payload["user_id"] = user_id

    # Auto-fill titular with user email (or a generic default) if not provided
    if "titular" not in payload or not payload.get("titular"):
        payload["titular"] = user_email or "Titular"

    # Serialize numeric fields as strings for PostgREST
    if "saldo_actual" in payload:
        payload["saldo_actual"] = str(payload["saldo_actual"])
    if "limite_credito" in payload and payload["limite_credito"] is not None:
        payload["limite_credito"] = str(payload["limite_credito"])

    try:
        response = client.table("tarjetas").insert(payload).execute()
        return _enrich_tarjeta(response.data[0])
    except IndexError:
        raise HTTPException(
            status_code=500, detail="Tarjeta no encontrada tras insercion."
        )
    except APIError as e:
        _handle_api_error(e)
    return {}


def update_tarjeta(
    user_jwt: str, user_id: str, tarjeta_id: str, data: TarjetaUpdate
) -> dict | None:
    """Update an existing tarjeta and return the updated record."""
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_unset=True)

    if not payload:
        raise HTTPException(status_code=422, detail="No hay campos para actualizar.")

    if "saldo_actual" in payload and payload["saldo_actual"] is not None:
        payload["saldo_actual"] = str(payload["saldo_actual"])
    if "limite_credito" in payload and payload["limite_credito"] is not None:
        payload["limite_credito"] = str(payload["limite_credito"])

    try:
        response = (
            client.table("tarjetas")
            .update(payload)
            .eq("id", tarjeta_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            return None
        return _enrich_tarjeta(response.data[0])
    except IndexError:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    except APIError as e:
        _handle_api_error(e)
    return None


def delete_tarjeta(user_jwt: str, user_id: str, tarjeta_id: str) -> None:
    """Hard-delete a tarjeta, scoped to the authenticated user."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("tarjetas")
            .delete()
            .eq("id", tarjeta_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
