from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
import app.services.retos as svc

router = APIRouter(prefix="/retos", tags=["retos"])


@router.get("/catalogo")
async def get_catalogo(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.get_catalogo(user_jwt=token)


@router.get("/mis-retos")
async def get_mis_retos(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.get_mis_retos(user_jwt=token, user_id=current_user["user_id"])


@router.post("/aceptar/{reto_id}", status_code=201)
async def aceptar_reto(
    reto_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.aceptar_reto(
        user_jwt=token,
        user_id=current_user["user_id"],
        reto_id=reto_id,
    )


@router.post("/checkin/{user_reto_id}")
async def checkin(
    user_reto_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.checkin_reto(
        user_jwt=token,
        user_id=current_user["user_id"],
        user_reto_id=user_reto_id,
    )


@router.patch("/abandonar/{user_reto_id}", status_code=204)
async def abandonar(
    user_reto_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    svc.abandonar_reto(
        user_jwt=token,
        user_id=current_user["user_id"],
        user_reto_id=user_reto_id,
    )
