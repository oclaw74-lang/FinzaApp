from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.notificacion import (
    CheckNotificacionesResponse,
    GenerarNotificacionesResponse,
    NotificacionResponse,
    PushSubscriptionCreate,
    PushSubscriptionResponse,
    VapidPublicKeyResponse,
)
import app.services.notificaciones as svc

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])


@router.get("", response_model=list[NotificacionResponse])
async def list_notificaciones(
    leida: bool | None = Query(None, description="Filter by read status"),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """List notifications for the authenticated user."""
    solo_no_leidas = leida is False
    return svc.get_notificaciones(
        user_jwt=token,
        user_id=current_user["user_id"],
        solo_no_leidas=solo_no_leidas,
    )


@router.patch("/leer-todas")
async def marcar_todas_leidas_endpoint(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Mark all notifications as read."""
    return svc.marcar_todas_leidas(user_jwt=token, user_id=current_user["user_id"])


@router.patch("/{notificacion_id}/leer", response_model=NotificacionResponse)
async def marcar_leida_endpoint(
    notificacion_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Mark a single notification as read."""
    return svc.marcar_leida(
        user_jwt=token,
        user_id=current_user["user_id"],
        notificacion_id=notificacion_id,
    )


@router.delete("/{notificacion_id}", status_code=204)
async def delete_notificacion(
    notificacion_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    """Delete a notification."""
    svc.eliminar_notificacion(
        user_jwt=token,
        user_id=current_user["user_id"],
        notificacion_id=notificacion_id,
    )


@router.post("/generar", response_model=GenerarNotificacionesResponse)
async def generar_notificaciones_endpoint(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Evaluate triggers and create smart notifications (idempotent, 24h window)."""
    return svc.generar_notificaciones(user_jwt=token, user_id=current_user["user_id"])


# --- Fix #20: check endpoint ---
@router.post("/check", response_model=CheckNotificacionesResponse)
async def check_notificaciones_endpoint(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Run 4 additional smart notification checks and create pending notifications.

    Triggers evaluated:
    - recordatorio_cobro: reminder 2 days before salary day.
    - alerta_gasto_excesivo: spend > 80% of monthly budget estimate.
    - alerta_prestamo_proximo: loan installment due in ≤5 days.
    - alerta_meta_progreso: weekly savings goal progress (Mondays).
    """
    return svc.check_notificaciones(user_jwt=token, user_id=current_user["user_id"])


# --- Fix #21: Web Push endpoints ---
@router.post("/subscribe", response_model=PushSubscriptionResponse, status_code=201)
async def subscribe_push_endpoint(
    body: PushSubscriptionCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """
    Register a Web Push subscription (Service Worker PushSubscription object).

    Expected body:
    ```json
    { "endpoint": "...", "keys": { "p256dh": "...", "auth": "..." } }
    ```
    """
    return svc.subscribe_push(
        user_jwt=token,
        user_id=current_user["user_id"],
        endpoint=body.endpoint,
        p256dh=body.keys.p256dh,
        auth=body.keys.auth,
    )


@router.get("/vapid-public-key", response_model=VapidPublicKeyResponse)
async def get_vapid_public_key_endpoint() -> dict:
    """Return the VAPID public key for Service Worker subscription."""
    return {"public_key": svc.get_vapid_public_key()}
