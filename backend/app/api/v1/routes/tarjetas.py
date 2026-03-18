from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user, get_raw_token
from app.schemas.tarjeta import TarjetaCreate, TarjetaResponse, TarjetaUpdate
from app.services import tarjetas as svc

router = APIRouter(prefix="/tarjetas", tags=["tarjetas"])


@router.get("", response_model=list[TarjetaResponse])
async def list_tarjetas(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_tarjetas(
        user_jwt=token,
        user_id=current_user["user_id"],
    )


@router.get("/{tarjeta_id}", response_model=TarjetaResponse)
async def get_tarjeta(
    tarjeta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.get_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    return result


@router.post("", response_model=TarjetaResponse, status_code=201)
async def create_tarjeta(
    data: TarjetaCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        data=data,
        user_email=current_user.get("email"),
    )


@router.put("/{tarjeta_id}", response_model=TarjetaResponse)
async def update_tarjeta(
    tarjeta_id: UUID,
    data: TarjetaUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.update_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
        data=data,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    return result


@router.delete("/{tarjeta_id}", status_code=204)
async def delete_tarjeta(
    tarjeta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
    )
