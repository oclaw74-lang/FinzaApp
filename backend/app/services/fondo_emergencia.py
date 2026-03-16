from datetime import date, datetime

from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.fondo_emergencia import FondoEmergenciaCreate, FondoEmergenciaUpdate
from app.services.base import _handle_api_error


def _calc_meta(client, user_id: str, meta_meses: int) -> float:
    """Average monthly expenses over last 3 months * meta_meses."""
    today = date.today()
    meses: list[tuple[int, int]] = []
    for i in range(3):
        m = today.month - i
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        meses.append((y, m))

    try:
        r = (
            client.table("egresos")
            .select("monto,fecha")
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
        return 0.0

    meses_set = set(meses)
    egresos = r.data or []
    totales: dict[tuple[int, int], float] = {}
    for e in egresos:
        fecha_str = e.get("fecha", "")
        if fecha_str:
            d = datetime.strptime(fecha_str[:10], "%Y-%m-%d")
            key = (d.year, d.month)
            if key in meses_set:
                totales[key] = totales.get(key, 0.0) + float(e["monto"])

    if not totales:
        return 0.0

    promedio = sum(totales.values()) / len(meses)
    return promedio * meta_meses


def _enrich(row: dict, client, user_id: str) -> dict:
    meta_calculada = _calc_meta(client, user_id, row["meta_meses"])
    monto_actual = float(row["monto_actual"])
    porcentaje = min(monto_actual / meta_calculada * 100, 100.0) if meta_calculada > 0 else 0.0
    return {
        **row,
        "monto_actual": monto_actual,
        "meta_calculada": meta_calculada if meta_calculada > 0 else None,
        "porcentaje": round(porcentaje, 2),
    }


def get_or_none(user_jwt: str, user_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("fondo_emergencia")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    # maybe_single() returns None directly when no row found
    if r is None or not r.data:
        return None
    return _enrich(r.data, client, user_id)


def create_fondo(user_jwt: str, user_id: str, data: FondoEmergenciaCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = {
        "user_id": user_id,
        "monto_actual": str(data.monto_actual),
        "meta_meses": data.meta_meses,
        "notas": data.notas,
    }
    try:
        r = client.table("fondo_emergencia").insert(payload).execute()
    except APIError as e:
        _handle_api_error(e)
    return _enrich(r.data[0], client, user_id)


def update_fondo(user_jwt: str, user_id: str, data: FondoEmergenciaUpdate) -> dict:
    client = get_user_client(user_jwt)
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "monto_actual" in payload:
        payload["monto_actual"] = str(payload["monto_actual"])
    if not payload:
        raise HTTPException(status_code=422, detail="No fields to update.")
    try:
        r = (
            client.table("fondo_emergencia")
            .update(payload)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    if not r.data:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    return _enrich(r.data[0], client, user_id)


def depositar(user_jwt: str, user_id: str, monto: float) -> dict:
    fondo = get_or_none(user_jwt, user_id)
    if fondo is None:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    nuevo_monto = fondo["monto_actual"] + monto
    return update_fondo(user_jwt, user_id, FondoEmergenciaUpdate(monto_actual=nuevo_monto))


def retirar(user_jwt: str, user_id: str, monto: float) -> dict:
    fondo = get_or_none(user_jwt, user_id)
    if fondo is None:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    nuevo_monto = max(0.0, fondo["monto_actual"] - monto)
    return update_fondo(user_jwt, user_id, FondoEmergenciaUpdate(monto_actual=nuevo_monto))
