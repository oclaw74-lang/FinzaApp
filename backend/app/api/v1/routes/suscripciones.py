from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
from app.schemas.suscripcion import (
    ConfirmarDetectadasRequest,
    SuscripcionCreate,
    SuscripcionResumenResponse,
    SuscripcionResponse,
    SuscripcionUpdate,
)
from app.services import suscripciones as svc

router = APIRouter(prefix="/suscripciones", tags=["suscripciones"])


@router.get("", response_model=list[SuscripcionResponse])
async def list_suscripciones(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.list_suscripciones(user_jwt=token, user_id=current_user["user_id"])


@router.get("/resumen", response_model=SuscripcionResumenResponse)
async def get_resumen(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_resumen(user_jwt=token, user_id=current_user["user_id"])


@router.post("", response_model=SuscripcionResponse, status_code=201)
async def create_suscripcion(
    data: SuscripcionCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_suscripcion(user_jwt=token, user_id=current_user["user_id"], data=data)


@router.put("/{suscripcion_id}", response_model=SuscripcionResponse)
async def update_suscripcion(
    suscripcion_id: str,
    data: SuscripcionUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_suscripcion(
        user_jwt=token,
        user_id=current_user["user_id"],
        suscripcion_id=suscripcion_id,
        data=data,
    )


@router.delete("/{suscripcion_id}", status_code=204)
async def delete_suscripcion(
    suscripcion_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_suscripcion(
        user_jwt=token, user_id=current_user["user_id"], suscripcion_id=suscripcion_id
    )


@router.post("/detectar", response_model=list[SuscripcionResponse])
async def detectar_suscripciones(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.detectar_suscripciones(user_jwt=token, user_id=current_user["user_id"])


@router.post("/confirmar-detectadas", response_model=list[SuscripcionResponse])
async def confirmar_detectadas(
    body: ConfirmarDetectadasRequest,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    # Convert validated candidates to dicts for service layer
    candidatos = [c.model_dump() for c in body.candidatos]
    return svc.confirmar_detectadas(user_jwt=token, user_id=current_user["user_id"], candidatos=candidatos)
