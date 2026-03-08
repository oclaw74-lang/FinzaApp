from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas.common import PaginatedResponse
from app.schemas.ingreso import IngresoCreate, IngresoResponse, IngresoUpdate
from app.services.ingresos import IngresosService

router = APIRouter(prefix="/ingresos", tags=["ingresos"])


@router.get("", response_model=PaginatedResponse[IngresoResponse])
async def list_ingresos(
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    categoria_id: UUID | None = Query(None),
    moneda: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> PaginatedResponse[IngresoResponse]:
    service = IngresosService(db)
    return await service.list_paginated(
        user_id=UUID(current_user["user_id"]),
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        categoria_id=categoria_id,
        moneda=moneda,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=IngresoResponse, status_code=201)
async def create_ingreso(
    data: IngresoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> IngresoResponse:
    service = IngresosService(db)
    return await service.create(user_id=UUID(current_user["user_id"]), data=data)


@router.get("/{ingreso_id}", response_model=IngresoResponse)
async def get_ingreso(
    ingreso_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> IngresoResponse:
    service = IngresosService(db)
    return await service.get_by_id(
        ingreso_id=ingreso_id, user_id=UUID(current_user["user_id"])
    )


@router.put("/{ingreso_id}", response_model=IngresoResponse)
async def update_ingreso(
    ingreso_id: UUID,
    data: IngresoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> IngresoResponse:
    service = IngresosService(db)
    return await service.update(
        ingreso_id=ingreso_id, user_id=UUID(current_user["user_id"]), data=data
    )


@router.delete("/{ingreso_id}", status_code=204)
async def delete_ingreso(
    ingreso_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    service = IngresosService(db)
    await service.soft_delete(
        ingreso_id=ingreso_id, user_id=UUID(current_user["user_id"])
    )
