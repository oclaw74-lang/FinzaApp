import calendar
from datetime import date

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
    # Convert UUID banco_id to string (or keep None to clear)
    if "banco_id" in payload and payload["banco_id"] is not None:
        payload["banco_id"] = str(payload["banco_id"])

    try:
        client.table("tarjetas").update(payload).eq("id", tarjeta_id).eq("user_id", user_id).execute()
    except APIError as e:
        _handle_api_error(e)
    # SDK does not return data from update; fetch updated row separately
    return get_tarjeta(user_jwt, user_id, tarjeta_id)


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


def toggle_bloquear_tarjeta(user_jwt: str, user_id: str, tarjeta_id: str) -> dict | None:
    """Toggle the bloqueada flag for a tarjeta and return the updated record."""
    tarjeta = get_tarjeta(user_jwt, user_id, tarjeta_id)
    if not tarjeta:
        return None

    nuevo_estado = not tarjeta.get("bloqueada", False)
    client = get_user_client(user_jwt)
    try:
        client.table("tarjetas").update({"bloqueada": nuevo_estado}).eq("id", tarjeta_id).eq("user_id", user_id).execute()
    except APIError as e:
        _handle_api_error(e)
    return get_tarjeta(user_jwt, user_id, tarjeta_id)


# ──────────────────────────────────────────────────────────────────────────────
# Payment-due notification helpers
# ──────────────────────────────────────────────────────────────────────────────

def _proximo_dia_del_mes(dia: int, today: date) -> date:
    """Return the date of the next (or same-day) occurrence of ``dia`` in the month."""
    last_day = calendar.monthrange(today.year, today.month)[1]
    candidate = date(today.year, today.month, min(dia, last_day))
    if candidate >= today:
        return candidate
    # Advance to next month
    next_month = today.month % 12 + 1
    next_year = today.year + (1 if today.month == 12 else 0)
    last_day_next = calendar.monthrange(next_year, next_month)[1]
    return date(next_year, next_month, min(dia, last_day_next))


def _days_until_dia_del_mes(dia: int, today: date) -> int:
    """Return the number of days from ``today`` until the next occurrence of ``dia``."""
    return (_proximo_dia_del_mes(dia, today) - today).days


def get_tarjetas_pago_pendiente(user_jwt: str, user_id: str) -> list[dict]:
    """Return credit cards with saldo_actual > 0 whose fecha_pago falls within 3 days."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("tarjetas")
            .select("*")
            .eq("user_id", user_id)
            .eq("tipo", "credito")
            .eq("activa", True)
            .execute()
        )
        tarjetas = response.data or []
    except APIError as e:
        _handle_api_error(e)
        return []

    today = date.today()
    resultado: list[dict] = []

    for tarjeta in tarjetas:
        saldo = float(tarjeta.get("saldo_actual") or 0)
        if saldo <= 0:
            continue

        fecha_pago_dia = tarjeta.get("fecha_pago")
        if not fecha_pago_dia:
            continue

        days_until = _days_until_dia_del_mes(int(fecha_pago_dia), today)
        if 0 <= days_until <= 3:
            enriched = _enrich_tarjeta(dict(tarjeta))
            enriched["dias_para_pago"] = days_until
            enriched["fecha_pago_proxima"] = str(_proximo_dia_del_mes(int(fecha_pago_dia), today))
            resultado.append(enriched)

    return resultado
