import os
import uuid as uuid_module
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_admin_client, get_user_client
from app.services.base import _handle_api_error

BUCKET = "estados-cuenta"


def upload_estado_cuenta(
    user_jwt: str,
    user_id: str,
    file_bytes: bytes,
    filename: str,
    content_type: str,
    tarjeta_id: Optional[str] = None,
    fecha_estado: Optional[str] = None,
    monto_total: Optional[float] = None,
) -> dict:
    """Upload a bank statement file to Supabase Storage and insert DB record."""
    admin = get_admin_client()
    safe_filename = os.path.basename(filename).replace("..", "__") or "estado_cuenta"
    path = f"{user_id}/{uuid_module.uuid4()}_{safe_filename}"

    try:
        admin.storage.from_(BUCKET).upload(path, file_bytes, {"content-type": content_type})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")

    public_url = admin.storage.from_(BUCKET).get_public_url(path)

    client = get_user_client(user_jwt)
    payload: dict = {
        "user_id": user_id,
        "nombre_archivo": safe_filename,
        "url_archivo": public_url,
    }
    if tarjeta_id:
        payload["tarjeta_id"] = tarjeta_id
    if fecha_estado:
        payload["fecha_estado"] = fecha_estado
    if monto_total is not None:
        payload["monto_total"] = str(monto_total)

    try:
        response = client.table("estados_cuenta").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(
            status_code=500, detail="Estado de cuenta no encontrado tras insercion."
        )
    except APIError as e:
        _handle_api_error(e)
    return {}


def list_estados_cuenta(
    user_jwt: str,
    user_id: str,
    tarjeta_id: Optional[str] = None,
) -> list[dict]:
    """List all non-deleted estados_cuenta for the user, optionally filtered by tarjeta_id."""
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("estados_cuenta")
            .select("*")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
        )
        if tarjeta_id:
            query = query.eq("tarjeta_id", tarjeta_id)
        response = query.execute()
        return response.data or []
    except APIError as e:
        _handle_api_error(e)
    return []


def delete_estado_cuenta(
    user_jwt: str,
    user_id: str,
    estado_id: str,
) -> None:
    """Soft-delete an estado_cuenta by setting deleted_at = NOW()."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("estados_cuenta")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", estado_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=404, detail="Estado de cuenta no encontrado."
            )
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
