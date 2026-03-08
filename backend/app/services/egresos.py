from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.egreso import Egreso
from app.schemas.common import PaginatedResponse
from app.schemas.egreso import EgresoCreate, EgresoResponse, EgresoUpdate


class EgresosService:
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
    ) -> PaginatedResponse[EgresoResponse]:
        base_query = select(Egreso).where(
            and_(Egreso.user_id == user_id, Egreso.deleted_at.is_(None))
        )
        if fecha_desde:
            base_query = base_query.where(Egreso.fecha >= fecha_desde)
        if fecha_hasta:
            base_query = base_query.where(Egreso.fecha <= fecha_hasta)
        if categoria_id:
            base_query = base_query.where(Egreso.categoria_id == categoria_id)
        if moneda:
            base_query = base_query.where(Egreso.moneda == moneda)

        count_result = await self.db.execute(
            select(func.count()).select_from(base_query.subquery())
        )
        total = count_result.scalar_one()

        items_result = await self.db.execute(
            base_query.order_by(Egreso.fecha.desc(), Egreso.created_at.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        items = [
            EgresoResponse.model_validate(i) for i in items_result.scalars().all()
        ]

        return PaginatedResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            has_next=(page * page_size) < total,
        )

    async def create(self, user_id: UUID, data: EgresoCreate) -> EgresoResponse:
        egreso = Egreso(
            user_id=user_id,
            categoria_id=data.categoria_id,
            subcategoria_id=data.subcategoria_id,
            monto=data.monto,
            moneda=data.moneda,
            descripcion=data.descripcion,
            metodo_pago=data.metodo_pago,
            fecha=data.fecha,
            notas=data.notas,
        )
        self.db.add(egreso)
        await self.db.flush()
        await self.db.refresh(egreso)
        return EgresoResponse.model_validate(egreso)

    async def get_by_id(self, egreso_id: UUID, user_id: UUID) -> EgresoResponse:
        egreso = await self._get_owned(egreso_id, user_id)
        return EgresoResponse.model_validate(egreso)

    async def update(
        self, egreso_id: UUID, user_id: UUID, data: EgresoUpdate
    ) -> EgresoResponse:
        egreso = await self._get_owned(egreso_id, user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(egreso, field, value)
        await self.db.flush()
        await self.db.refresh(egreso)
        return EgresoResponse.model_validate(egreso)

    async def soft_delete(self, egreso_id: UUID, user_id: UUID) -> None:
        egreso = await self._get_owned(egreso_id, user_id)
        egreso.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def _get_owned(self, egreso_id: UUID, user_id: UUID) -> Egreso:
        result = await self.db.execute(
            select(Egreso).where(
                and_(Egreso.id == egreso_id, Egreso.deleted_at.is_(None))
            )
        )
        egreso = result.scalar_one_or_none()
        if not egreso:
            raise NotFoundError("Egreso no encontrado.")
        if egreso.user_id != user_id:
            raise ForbiddenError("No tienes acceso a este egreso.")
        return egreso
