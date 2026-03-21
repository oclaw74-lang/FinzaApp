from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.meta_ahorro import (
    ContribucionMetaCreate,
    ContribucionMetaResponse,
    MetaAhorroCreate,
    MetaAhorroResponse,
    MetaAhorroUpdate,
    MetasResumen,
)
from app.services import metas_ahorro as svc

router = APIRouter(prefix="/metas", tags=["metas"])


@router.get("", response_model=list[MetaAhorroResponse])
async def list_metas(
    estado: str | None = Query(
        None, description="Filtrar por estado: activa, completada, cancelada"
    ),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_metas(user_jwt=token, estado=estado)


@router.post("", response_model=MetaAhorroResponse, status_code=201)
async def create_meta(
    data: MetaAhorroCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_meta(user_jwt=token, user_id=current_user["user_id"], data=data)


# IMPORTANTE: /resumen debe ir ANTES de /{meta_id} para evitar que el
# path param capture la cadena literal "resumen"
@router.get("/resumen", response_model=MetasResumen)
async def get_resumen(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_resumen(user_jwt=token)


@router.get("/{meta_id}", response_model=MetaAhorroResponse)
async def get_meta(
    meta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_meta_by_id(user_jwt=token, meta_id=str(meta_id))


@router.put("/{meta_id}", response_model=MetaAhorroResponse)
async def update_meta(
    meta_id: UUID,
    data: MetaAhorroUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_meta(user_jwt=token, meta_id=str(meta_id), data=data)


@router.delete("/{meta_id}", status_code=204)
async def delete_meta(
    meta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_meta(user_jwt=token, meta_id=str(meta_id))


@router.post("/{meta_id}/contribuciones", response_model=ContribucionMetaResponse, status_code=201)
async def agregar_contribucion(
    meta_id: UUID,
    data: ContribucionMetaCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.agregar_contribucion(user_jwt=token, user_id=current_user["user_id"], meta_id=str(meta_id), data=data)


@router.get("/{meta_id}/contribuciones", response_model=list[ContribucionMetaResponse])
async def list_contribuciones(
    meta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_contribuciones(user_jwt=token, meta_id=str(meta_id))


@router.delete("/{meta_id}/contribuciones/{contribucion_id}", status_code=204)
async def delete_contribucion(
    meta_id: UUID,
    contribucion_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_contribucion(
        user_jwt=token,
        meta_id=str(meta_id),
        contribucion_id=str(contribucion_id),
    )
