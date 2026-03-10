from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.prestamo import PagoPrestamoCreate, PrestamoCreate, PrestamoUpdate
from app.services.base import _handle_api_error


def get_prestamos(
    user_jwt: str,
    user_id: str,
    tipo: str | None = None,
    estado: str | None = None,
) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("prestamos")
            .select("*")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
        )
        if tipo:
            query = query.eq("tipo", tipo)
        if estado:
            query = query.eq("estado", estado)

        response = query.execute()
        return response.data
    except APIError as e:
        _handle_api_error(e)
    return []


def create_prestamo(user_jwt: str, user_id: str, data: PrestamoCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = data.model_dump()
    payload["user_id"] = user_id
    payload["monto_pendiente"] = str(payload["monto_original"])
    payload["monto_original"] = str(payload["monto_original"])
    payload["fecha_prestamo"] = str(payload["fecha_prestamo"])
    if payload.get("fecha_vencimiento"):
        payload["fecha_vencimiento"] = str(payload["fecha_vencimiento"])

    try:
        response = client.table("prestamos").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(
            status_code=500, detail="Prestamo no encontrado tras insercion."
        )
    except APIError as e:
        _handle_api_error(e)
    return {}


def get_prestamo(user_jwt: str, user_id: str, prestamo_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("prestamos")
            .select("*")
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not response.data:
            return None

        prestamo = response.data

        pagos_response = (
            client.table("pagos_prestamo")
            .select("*")
            .eq("prestamo_id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("fecha", desc=True)
            .execute()
        )
        prestamo["pagos"] = pagos_response.data or []
        return prestamo
    except APIError as e:
        _handle_api_error(e)
    return None


def update_prestamo(
    user_jwt: str, user_id: str, prestamo_id: str, data: PrestamoUpdate
) -> dict | None:
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_unset=True)

    if not payload:
        raise HTTPException(status_code=422, detail="No hay campos para actualizar.")

    if "fecha_vencimiento" in payload and payload["fecha_vencimiento"]:
        payload["fecha_vencimiento"] = str(payload["fecha_vencimiento"])

    try:
        response = (
            client.table("prestamos")
            .update(payload)
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        return response.data[0] if response.data else None
    except IndexError:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    except APIError as e:
        _handle_api_error(e)
    return None


def delete_prestamo(user_jwt: str, user_id: str, prestamo_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("prestamos")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    except APIError as e:
        _handle_api_error(e)
    return {}


def get_pagos(
    user_jwt: str, user_id: str, prestamo_id: str
) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        prestamo_check = (
            client.table("prestamos")
            .select("id")
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not prestamo_check.data:
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")

        response = (
            client.table("pagos_prestamo")
            .select("*")
            .eq("prestamo_id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .order("fecha", desc=True)
            .execute()
        )
        return response.data
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return []


def registrar_pago(
    user_jwt: str,
    user_id: str,
    prestamo_id: str,
    data: PagoPrestamoCreate,
) -> dict:
    client = get_user_client(user_jwt)
    try:
        result = client.rpc(
            "registrar_pago_prestamo",
            {
                "p_prestamo_id": prestamo_id,
                "p_user_id": user_id,
                "p_monto": str(data.monto),
                "p_fecha": str(data.fecha),
                "p_notas": data.notas,
            },
        ).execute()

        if not result.data:
            raise HTTPException(
                status_code=500, detail="Error al registrar el pago."
            )
        return result.data
    except HTTPException:
        raise
    except APIError as e:
        msg = str(e.message) if e.message else ""
        if "no encontrado" in msg.lower():
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
        if "no esta activo" in msg.lower():
            raise HTTPException(
                status_code=400, detail="El prestamo no esta activo."
            )
        if "excede el pendiente" in msg.lower():
            raise HTTPException(
                status_code=400,
                detail="El monto del pago excede el monto pendiente.",
            )
        _handle_api_error(e)
    return {}


def delete_pago(
    user_jwt: str, user_id: str, prestamo_id: str, pago_id: str
) -> dict:
    client = get_user_client(user_jwt)
    try:
        pago_response = (
            client.table("pagos_prestamo")
            .select("*")
            .eq("id", pago_id)
            .eq("prestamo_id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not pago_response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        pago = pago_response.data
        monto_pago = Decimal(str(pago["monto"]))

        soft_delete_response = (
            client.table("pagos_prestamo")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", pago_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not soft_delete_response.data:
            raise HTTPException(status_code=404, detail="Pago no encontrado.")

        prestamo_response = (
            client.table("prestamos")
            .select("monto_pendiente, monto_original, estado")
            .eq("id", prestamo_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        if not prestamo_response.data:
            raise HTTPException(status_code=404, detail="Prestamo no encontrado.")

        prestamo = prestamo_response.data
        nuevo_pendiente = Decimal(str(prestamo["monto_pendiente"])) + monto_pago
        monto_original = Decimal(str(prestamo["monto_original"]))

        if nuevo_pendiente > monto_original:
            nuevo_pendiente = monto_original

        nuevo_estado = "activo" if nuevo_pendiente > 0 else "pagado"

        client.table("prestamos").update(
            {
                "monto_pendiente": str(nuevo_pendiente),
                "estado": nuevo_estado,
            }
        ).eq("id", prestamo_id).eq("user_id", user_id).execute()

        return soft_delete_response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def get_resumen(user_jwt: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("prestamos")
            .select("tipo, estado, monto_original, monto_pendiente")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
        )
        prestamos = response.data or []

        me_deben_activos = [
            p for p in prestamos if p["tipo"] == "me_deben" and p["estado"] == "activo"
        ]
        yo_debo_activos = [
            p for p in prestamos if p["tipo"] == "yo_debo" and p["estado"] == "activo"
        ]

        def sumar(lista: list[dict], campo: str) -> Decimal:
            return sum(Decimal(str(p[campo])) for p in lista)

        return {
            "total_me_deben": float(sumar(me_deben_activos, "monto_pendiente")),
            "total_yo_debo": float(sumar(yo_debo_activos, "monto_pendiente")),
            "cantidad_activos": sum(1 for p in prestamos if p["estado"] == "activo"),
            "cantidad_vencidos": sum(1 for p in prestamos if p["estado"] == "vencido"),
        }
    except APIError as e:
        _handle_api_error(e)
    return {}
