import calendar
from datetime import date

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.recurrente import RecurrenteCreate, RecurrenteUpdate
from app.services.base import _handle_api_error


def get_recurrentes(user_jwt: str, activo: bool | None = None) -> list[dict]:
    """Return all recurring transactions for the user, optionally filtered by activo."""
    client = get_user_client(user_jwt)
    try:
        query = (
            client.table("recurrentes")
            .select("*")
            .order("created_at", desc=True)
        )
        if activo is not None:
            query = query.eq("activo", activo)

        response = query.execute()
        return response.data or []
    except APIError as e:
        _handle_api_error(e)
    return []


def get_recurrente_by_id(user_jwt: str, recurrente_id: str) -> dict:
    """Return a single recurring transaction by id. Raises 404 if not found."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("recurrentes")
            .select("*")
            .eq("id", recurrente_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Recurrente no encontrado.")
        return response.data
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def create_recurrente(user_jwt: str, user_id: str, data: RecurrenteCreate) -> dict:
    """Insert a new recurring transaction for the user."""
    client = get_user_client(user_jwt)
    payload = data.model_dump()
    payload["user_id"] = user_id
    payload["monto"] = str(payload["monto"])
    payload["fecha_inicio"] = str(payload["fecha_inicio"])
    if payload.get("fecha_fin"):
        payload["fecha_fin"] = str(payload["fecha_fin"])
    if payload.get("categoria_id"):
        payload["categoria_id"] = str(payload["categoria_id"])

    try:
        response = client.table("recurrentes").insert(payload).execute()
        if not response.data:
            raise HTTPException(
                status_code=500, detail="Recurrente no encontrado tras insercion."
            )
        return response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def update_recurrente(user_jwt: str, recurrente_id: str, data: RecurrenteUpdate) -> dict:
    """Update an existing recurring transaction. Raises 404 if not found."""
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_unset=True)

    if not payload:
        raise HTTPException(status_code=422, detail="No hay campos para actualizar.")

    if "monto" in payload and payload["monto"] is not None:
        payload["monto"] = str(payload["monto"])
    if "fecha_fin" in payload and payload["fecha_fin"] is not None:
        payload["fecha_fin"] = str(payload["fecha_fin"])
    if "categoria_id" in payload and payload["categoria_id"] is not None:
        payload["categoria_id"] = str(payload["categoria_id"])

    try:
        response = (
            client.table("recurrentes")
            .update(payload)
            .eq("id", recurrente_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Recurrente no encontrado.")
        return response.data[0]
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)
    return {}


def delete_recurrente(user_jwt: str, recurrente_id: str) -> None:
    """Delete a recurring transaction. Raises 404 if not found."""
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("recurrentes")
            .delete()
            .eq("id", recurrente_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Recurrente no encontrado.")
    except HTTPException:
        raise
    except APIError as e:
        _handle_api_error(e)


def _calcular_fecha_estimada(recurrente: dict, mes: int, year: int) -> date | None:
    """Calculate the estimated execution date for a recurrente in the given month/year.

    Returns None if the recurrente does not apply in this month (date range exclusions).

    Logic per frecuencia:
    - diaria:    occurs every day -> first day of the month as reference
    - semanal:   at least one occurrence per week in any month -> first day of month
    - quincenal: occurs on days 1 and 16 -> first day of month as reference
    - mensual:   occurs on dia_del_mes (clamped to last day if exceeds month length)
    """
    last_day = calendar.monthrange(year, mes)[1]
    first_day_of_month = date(year, mes, 1)
    last_day_of_month = date(year, mes, last_day)

    # Parse date strings from Supabase
    fecha_inicio_str = recurrente.get("fecha_inicio")
    fecha_fin_str = recurrente.get("fecha_fin")

    try:
        fecha_inicio = date.fromisoformat(fecha_inicio_str) if fecha_inicio_str else None
    except (ValueError, TypeError):
        fecha_inicio = None

    try:
        fecha_fin = date.fromisoformat(fecha_fin_str) if fecha_fin_str else None
    except (ValueError, TypeError):
        fecha_fin = None

    # Exclude if fecha_fin is before the start of the month
    if fecha_fin and fecha_fin < first_day_of_month:
        return None

    # Exclude if fecha_inicio is after the end of the month
    if fecha_inicio and fecha_inicio > last_day_of_month:
        return None

    frecuencia = recurrente.get("frecuencia", "")

    if frecuencia == "diaria":
        return first_day_of_month

    if frecuencia == "semanal":
        # At least one occurrence in every month — use first day as reference
        return first_day_of_month

    if frecuencia == "quincenal":
        # Occurs on day 1 and day 16 of every month
        return first_day_of_month

    if frecuencia == "mensual":
        dia = recurrente.get("dia_del_mes") or 1
        # Clamp to last day of month (e.g. dia=31 in February -> day 28/29)
        dia_efectivo = min(dia, last_day)
        return date(year, mes, dia_efectivo)

    return None


def get_proximos_mes(user_jwt: str, mes: int, year: int) -> list[dict]:
    """Return active recurrentes with their estimated execution date in the given month.

    Excludes:
    - Inactive recurrentes
    - Recurrentes whose fecha_fin is before the start of the month
    - Recurrentes whose fecha_inicio is after the end of the month
    """
    client = get_user_client(user_jwt)
    try:
        response = (
            client.table("recurrentes")
            .select("*")
            .eq("activo", True)
            .execute()
        )
        recurrentes = response.data or []
    except APIError as e:
        _handle_api_error(e)
        return []

    result = []
    for rec in recurrentes:
        fecha_estimada = _calcular_fecha_estimada(rec, mes, year)
        if fecha_estimada is not None:
            result.append(
                {
                    "recurrente": rec,
                    "fecha_estimada": fecha_estimada,
                }
            )

    # Sort by estimated date ascending
    result.sort(key=lambda x: x["fecha_estimada"])
    return result
