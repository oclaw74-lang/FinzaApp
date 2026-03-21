import logging
from datetime import datetime, timezone

from fastapi import HTTPException

from app.core.supabase_client import get_user_client
from app.schemas.dual_moneda import DualMonedaConfig, DualMonedaUpdate

logger = logging.getLogger(__name__)


def get_dual_moneda_config(user_jwt: str, user_id: str) -> DualMonedaConfig:
    """Return the user's primary + secondary currency config and exchange rate."""
    client = get_user_client(user_jwt)

    response = (
        client.table("user_config")
        .select("moneda, moneda_secundaria, tasa_cambio, tasa_cambio_actualizada_at")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not (response and response.data):
        return DualMonedaConfig(moneda_principal="DOP")

    d = response.data
    return DualMonedaConfig(
        moneda_principal=d.get("moneda") or "DOP",
        moneda_secundaria=d.get("moneda_secundaria"),
        tasa_cambio=d.get("tasa_cambio"),
        tasa_cambio_actualizada_at=d.get("tasa_cambio_actualizada_at"),
    )


def update_dual_moneda_config(
    user_jwt: str, user_id: str, data: DualMonedaUpdate
) -> DualMonedaConfig:
    """Update secondary currency and/or exchange rate for the user."""
    client = get_user_client(user_jwt)

    update_payload: dict = {}
    if data.moneda_secundaria is not None:
        # An empty string explicitly clears the secondary currency
        update_payload["moneda_secundaria"] = (
            data.moneda_secundaria if data.moneda_secundaria != "" else None
        )
    if data.tasa_cambio is not None:
        update_payload["tasa_cambio"] = data.tasa_cambio
        update_payload["tasa_cambio_actualizada_at"] = datetime.now(
            timezone.utc
        ).isoformat()

    if not update_payload:
        return get_dual_moneda_config(user_jwt, user_id)

    client.table("user_config").update(update_payload).eq("user_id", user_id).execute()
    return get_dual_moneda_config(user_jwt, user_id)
