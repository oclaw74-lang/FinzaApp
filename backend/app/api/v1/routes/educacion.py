from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
import app.services.educacion as svc

router = APIRouter(prefix="/educacion", tags=["educacion"])


@router.get("/lecciones")
async def get_lecciones(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.get_lecciones(user_jwt=token, user_id=current_user["user_id"])


@router.post("/lecciones/{leccion_id}/completar")
async def completar(
    leccion_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.marcar_completada(
        user_jwt=token,
        user_id=current_user["user_id"],
        leccion_id=leccion_id,
    )
