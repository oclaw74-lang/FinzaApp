from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.ingreso import Ingreso
from app.schemas.common import PaginatedResponse
from app.schemas.ingreso import IngresoCreate, IngresoResponse, IngresoUpdate


class IngresosService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_paginated(
        self,
        user_id: UUID,
        fecha_desde: date | None,
        fecha_hasta: date | None,
        categoria_id: UUID | None,
        moneda: str | None,
        page: int,
        page_size: int,
    ) -> PaginatedResponse[IngresoResponse]:
        base_query = select(Ingreso).where(
            and_(Ingreso.user_id == user_id, Ingreso.deleted_at.is_(None))
        )
        if fecha_desde:
            base_query = base_query.where(Ingreso.fecha >= fecha_desde)
        if fecha_hasta:
            base_query = base_query.where(Ingreso.fecha <= fecha_hasta)
        if categoria_id:
            base_query = base_query.where(Ingreso.categoria_id == categoria_id)
        if moneda:
            base_query = base_query.where(Ingreso.moneda == moneda)

        count_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        items_result = await self.db.execute(
            base_query.order_by(Ingreso.fecha.desc(), Ingreso.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = [
            IngresoResponse.model_validate(i) for i in items_result.scalars().all()
        ]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_next=(page * page_size) < total,
        )

    async def create(self, user_id: UUID, data: IngresoCreate) -> IngresoResponse:
        ingreso = Ingreso(
            user_id=user_id,
            categoria_id=data.categoria_id,
            subcategoria_id=data.subcategoria_id,
            monto=data.monto,
            moneda=data.moneda,
            descripcion=data.descripcion,
            fuente=data.fuente,
            fecha=data.fecha,
            notas=data.notas,
        )
        self.db.add(ingreso)
        await self.db.flush()
        await self.db.refresh(ingreso)
        return IngresoResponse.model_validate(ingreso)

    async def get_by_id(self, ingreso_id: UUID, user_id: UUID) -> IngresoResponse:
        ingreso = await self._get_owned(ingreso_id, user_id)
        return IngresoResponse.model_validate(ingreso)

    async def update(
        self, ingreso_id: UUID, user_id: UUID, data: IngresoUpdate
    ) -> IngresoResponse:
        ingreso = await self._get_owned(ingreso_id, user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(ingreso, field, value)
        await self.db.flush()
        await self.db.refresh(ingreso)
        return IngresoResponse.model_validate(ingreso)

    async def soft_delete(self, ingreso_id: UUID, user_id: UUID) -> None:
        ingreso = await self._get_owned(ingreso_id, user_id)
        ingreso.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def _get_owned(self, ingreso_id: UUID, user_id: UUID) -> Ingreso:
        result = await self.db.execute(
            select(Ingreso).where(
                and_(Ingreso.id == ingreso_id, Ingreso.deleted_at.is_(None))
            )
        )
        ingreso = result.scalar_one_or_none()
        if not ingreso:
            raise NotFoundError("Ingreso no encontrado.")
        if ingreso.user_id != user_id:
            raise ForbiddenError("No tienes acceso a este ingreso.")
        return ingreso
