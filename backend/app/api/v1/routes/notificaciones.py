from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.notificacion import GenerarNotificacionesResponse, NotificacionResponse
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
