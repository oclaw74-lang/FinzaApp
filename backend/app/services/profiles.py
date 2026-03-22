from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.profile import ProfileUpdate
from app.services.base import _handle_api_error

_DECIMAL_FIELDS = {
    "salario_bruto",
    "salario_neto",
    "descuentos_adicionales",
    "porcentaje_ahorro_metas",
    "porcentaje_ahorro_fondo",
}


def _enrich(row: dict) -> dict:
    salario = row.get("salario_neto")
    horas_por_peso = round(160.0 / float(salario), 6) if salario and float(salario) > 0 else None
    enriched = {
        **row,
        "horas_por_peso": horas_por_peso,
    }
    for field in _DECIMAL_FIELDS:
        if field in enriched and enriched[field] is not None:
            enriched[field] = float(enriched[field])
    if "asignacion_automatica_activa" not in enriched:
        enriched["asignacion_automatica_activa"] = False
    return enriched


def get_or_create_profile(user_jwt: str, user_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("profiles")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    # maybe_single() returns None directly when no row found
    if r is not None and r.data:
        return _enrich(r.data)

    # Create default profile
    try:
        r2 = (
            client.table("profiles")
            .insert({"user_id": user_id})
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    return _enrich(r2.data[0])


def update_profile(user_jwt: str, user_id: str, data: ProfileUpdate) -> dict:
    client = get_user_client(user_jwt)
    payload = data.model_dump(exclude_none=True)
    if not payload:
        return get_or_create_profile(user_jwt, user_id)

    for field in _DECIMAL_FIELDS:
        if field in payload and payload[field] is not None:
            payload[field] = str(payload[field])

    try:
        r = (
            client.table("profiles")
            .upsert({"user_id": user_id, **payload})
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    return _enrich(r.data[0])

