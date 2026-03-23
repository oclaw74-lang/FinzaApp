from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def list_ingresos(
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
            client.table("ingresos")
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


def get_ingreso(user_jwt: str, ingreso_id: str, user_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("ingresos")
            .select("*")
            .eq("id", ingreso_id)
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .maybe_single()
            .execute()
        )
        return response.data if response else None
    except APIError as e:
        _handle_api_error(e)


def create_ingreso(user_jwt: str, user_id: str, data: dict) -> dict:
    client = get_user_client(user_jwt)
    payload = {**data, "user_id": user_id}
    try:
        response = client.table("ingresos").insert(payload).execute()
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado tras insercion.")
    except APIError as e:
        _handle_api_error(e)


def update_ingreso(
    user_jwt: str, ingreso_id: str, user_id: str, data: dict
) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("ingresos")
            .update(data)
            .eq("id", ingreso_id)
            .eq("user_id", user_id)
            .execute()
        )
        return response.data[0] if response.data else None
    except IndexError:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
    except APIError as e:
        _handle_api_error(e)


def delete_ingreso(user_jwt: str, ingreso_id: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("ingresos")
            .update({"deleted_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", ingreso_id)
            .eq("user_id", user_id)
            .execute()
        )
        if not (response and response.data):
            raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
        return response.data[0]
    except IndexError:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
    except APIError as e:
        _handle_api_error(e)


def distribuir_ahorro_automatico(user_jwt: str, user_id: str, monto: Decimal) -> None:
    """Distribute savings automatically after a salary income is registered.

    Reads the user profile to check if automatic assignment is active, then
    deposits proportional amounts to active savings goals and/or the emergency fund.
    Failures are silently ignored so they never block income creation.
    """
    client = get_user_client(user_jwt)

    try:
        profile_r = (
            client.table("profiles")
            .select("asignacion_automatica_activa,porcentaje_ahorro_metas,porcentaje_ahorro_fondo")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except APIError:
        return

    if not profile_r or not profile_r.data:
        return

    profile = profile_r.data
    if not profile.get("asignacion_automatica_activa"):
        return

    pct_metas = profile.get("porcentaje_ahorro_metas")
    pct_fondo = profile.get("porcentaje_ahorro_fondo")
    today = str(date.today())

    if pct_metas is not None:
        monto_metas = Decimal(str(monto)) * Decimal(str(pct_metas)) / Decimal("100")
        if monto_metas > 0:
            try:
                metas_r = (
                    client.table("metas_ahorro")
                    .select("id,monto_actual,monto_objetivo")
                    .eq("user_id", user_id)
                    .eq("estado", "activa")
                    .execute()
                )
                metas_pendientes = [
                    m for m in (metas_r.data or [])
                    if Decimal(str(m.get("monto_actual", 0))) < Decimal(str(m.get("monto_objetivo", 0)))
                ]
                if metas_pendientes:
                    por_meta = monto_metas / len(metas_pendientes)
                    for meta in metas_pendientes:
                        client.rpc(
                            "agregar_contribucion_meta",
                            {
                                "p_meta_id": meta["id"],
                                "p_monto": float(por_meta),
                                "p_tipo": "deposito",
                                "p_fecha": today,
                                "p_notas": "Asignacion automatica de ahorro",
                            },
                        ).execute()
            except (APIError, Exception):
                pass

    if pct_fondo is not None:
        monto_fondo = Decimal(str(monto)) * Decimal(str(pct_fondo)) / Decimal("100")
        if monto_fondo > 0:
            try:
                fondo_r = (
                    client.table("fondo_emergencia")
                    .select("id,monto_actual")
                    .eq("user_id", user_id)
                    .maybe_single()
                    .execute()
                )
                if fondo_r and fondo_r.data:
                    fondo = fondo_r.data
                    nuevo_monto = Decimal(str(fondo["monto_actual"])) + monto_fondo
                    client.table("fondo_emergencia").update(
                        {"monto_actual": str(nuevo_monto)}
                    ).eq("user_id", user_id).execute()
            except (APIError, Exception):
                pass
