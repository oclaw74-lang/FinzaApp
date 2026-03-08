from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas.common import PaginatedResponse
from app.schemas.egreso import EgresoCreate, EgresoResponse, EgresoUpdate
from app.services.egresos import EgresosService

router = APIRouter(prefix="/egresos", tags=["egresos"])


@router.get("", response_model=PaginatedResponse[EgresoResponse])
async def list_egresos(
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    categoria_id: UUID | None = Query(None),
    moneda: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[EgresoResponse]:
    service = EgresosService(db)
    return await service.list_paginated(
        user_id=UUID(current_user["user_id"]),
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        categoria_id=categoria_id,
        moneda=moneda,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=EgresoResponse, status_code=201)
async def create_egreso(
    data: EgresoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> EgresoResponse:
    service = EgresosService(db)
    return await service.create(user_id=UUID(current_user["user_id"]), data=data)


@router.get("/{egreso_id}", response_model=EgresoResponse)
async def get_egreso(
    egreso_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> EgresoResponse:
    service = EgresosService(db)
    return await service.get_by_id(
        egreso_id=egreso_id, user_id=UUID(current_user["user_id"])
    )


@router.put("/{egreso_id}", response_model=EgresoResponse)
async def update_egreso(
    egreso_id: UUID,
    data: EgresoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> EgresoResponse:
    service = EgresosService(db)
    return await service.update(
        egreso_id=egreso_id, user_id=UUID(current_user["user_id"]), data=data
    )


@router.delete("/{egreso_id}", status_code=204)
async def delete_egreso(
    egreso_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    service = EgresosService(db)
    await service.soft_delete(
        egreso_id=egreso_id, user_id=UUID(current_user["user_id"])
    )
