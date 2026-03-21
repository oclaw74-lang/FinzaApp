"""Service for tarjeta movements (purchases, payments, and deposits)."""
from datetime import date, datetime, timezone

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def _get_tarjeta_simple(client, tarjeta_id: str, user_id: str) -> dict | None:
    """Fetch minimal tarjeta data to validate status before movement registration."""
    try:
        response = (
            client.table("tarjetas")
            .select("id,bloqueada,activa")
            .eq("id", tarjeta_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return response.data or None
    except Exception:
        return None


def registrar_movimiento(
    user_jwt: str,
    user_id: str,
    tarjeta_id: str,
    tipo: str,
    monto: float,
    fecha: date,
    descripcion: str | None = None,
    categoria_id: str | None = None,
    notas: str | None = None,
) -> dict:
    """Register a tarjeta movement (compra or pago) via atomic RPC."""
    client = get_user_client(user_jwt)

    tarjeta = _get_tarjeta_simple(client, tarjeta_id, user_id)
    if tarjeta and tarjeta.get("bloqueada"):
        raise HTTPException(
            status_code=400,
            detail="La tarjeta está bloqueada. Desbloquéala para registrar movimientos.",
        )

    try:
        result = client.rpc(
            "registrar_movimiento_tarjeta",
            {
                "p_tarjeta_id": tarjeta_id,
                "p_user_id": user_id,
                "p_tipo": tipo,
                "p_monto": float(monto),
                "p_fecha": str(fecha),
                "p_descripcion": descripcion,
                "p_notas": notas,
                "p_categoria_id": str(categoria_id) if categoria_id else None,
            },
        ).execute()

        if not result.data:
            raise HTTPException(
                status_code=500, detail="Error al registrar el movimiento."
            )
        return result.data
    except HTTPException:
        raise
    except APIError as e:
        msg = str(e.message) if e.message else ""
        if "no encontrada o inactiva" in msg.lower():
            raise HTTPException(status_code=404, detail="Tarjeta no encontrada o inactiva.")
        if "excede el limite" in msg.lower():
            raise HTTPException(status_code=400, detail=msg)
        if "saldo insuficiente" in msg.lower():
            raise HTTPException(status_code=400, detail=msg)
        if "excede la deuda" in msg.lower():
            raise HTTPException(status_code=400, detail=msg)
        if "deposito en una tarjeta de credito" in msg.lower():
            raise HTTPException(status_code=400, detail=msg)
        _handle_api_error(e)
    return {}


def get_movimientos(
    user_jwt: str,
    user_id: str,
    tarjeta_id: str,
    tipo: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    """Return movements for a tarjeta, scoped to the authenticated user."""
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("movimientos_tarjeta")
            .select("*")
            .eq("tarjeta_id", tarjeta_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("fecha", desc=True)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
        )
        if tipo:
            query = query.eq("tipo", tipo)
        return query.execute().data or []
    except APIError as e:
        _handle_api_error(e)
    return []


def delete_movimiento(
    user_jwt: str,
    user_id: str,
    tarjeta_id: str,
    movimiento_id: str,
) -> None:
    """Soft-delete a movimiento. The trigger reverts the tarjeta saldo automatically."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("movimientos_tarjeta")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", movimiento_id)
            .eq("tarjeta_id", tarjeta_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Movimiento no encontrado.")
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
