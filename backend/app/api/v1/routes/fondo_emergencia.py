from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, get_raw_token
from app.schemas.fondo_emergencia import (
    FondoEmergenciaCreate,
    FondoEmergenciaResponse,
    FondoEmergenciaUpdate,
    MontoRequest,
)
from app.services import fondo_emergencia as svc

router = APIRouter(prefix="/fondo-emergencia", tags=["fondo-emergencia"])


@router.get("", response_model=FondoEmergenciaResponse)
async def get_fondo(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    fondo = svc.get_or_none(user_jwt=token, user_id=current_user["user_id"])
    if fondo is None:
        raise HTTPException(status_code=404, detail="Fondo de emergencia no encontrado.")
    return fondo


@router.post("", response_model=FondoEmergenciaResponse, status_code=201)
async def create_fondo(
    data: FondoEmergenciaCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_fondo(user_jwt=token, user_id=current_user["user_id"], data=data)


@router.patch("", response_model=FondoEmergenciaResponse)
async def update_fondo(
    data: FondoEmergenciaUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_fondo(user_jwt=token, user_id=current_user["user_id"], data=data)


@router.post("/depositar", response_model=FondoEmergenciaResponse)
async def depositar(
    body: MontoRequest,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.depositar(user_jwt=token, user_id=current_user["user_id"], monto=body.monto)


@router.post("/retirar", response_model=FondoEmergenciaResponse)
async def retirar(
    body: MontoRequest,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.retirar(user_jwt=token, user_id=current_user["user_id"], monto=body.monto)
