from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.categoria import Categoria
from app.schemas.categoria import CategoriaCreate, CategoriaResponse, CategoriaUpdate


class CategoriasService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_for_user(
        self, user_id: UUID, tipo: str | None = None
    ) -> list[CategoriaResponse]:
        query = select(Categoria).where(
            and_(
                or_(Categoria.user_id == user_id, Categoria.user_id.is_(None)),
                Categoria.deleted_at.is_(None),
            )
        )
        if tipo:
            query = query.where(Categoria.tipo == tipo)
        query = query.order_by(Categoria.es_sistema.desc(), Categoria.nombre)
        result = await self.db.execute(query)
        return [CategoriaResponse.model_validate(c) for c in result.scalars().all()]

    async def create(self, user_id: UUID, data: CategoriaCreate) -> CategoriaResponse:
        categoria = Categoria(
            user_id=user_id,
            nombre=data.nombre,
            tipo=data.tipo,
            icono=data.icono,
            color=data.color,
            es_sistema=False,
        )
        self.db.add(categoria)
        await self.db.flush()
        await self.db.refresh(categoria)
        return CategoriaResponse.model_validate(categoria)

    async def update(
        self, categoria_id: UUID, user_id: UUID, data: CategoriaUpdate
    ) -> CategoriaResponse:
        categoria = await self._get_owned(categoria_id, user_id)
        if data.nombre is not None:
            categoria.nombre = data.nombre
        if data.icono is not None:
            categoria.icono = data.icono
        if data.color is not None:
            categoria.color = data.color
        await self.db.flush()
        await self.db.refresh(categoria)
        return CategoriaResponse.model_validate(categoria)

    async def soft_delete(self, categoria_id: UUID, user_id: UUID) -> None:
        categoria = await self._get_owned(categoria_id, user_id)
        categoria.deleted_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def _get_owned(self, categoria_id: UUID, user_id: UUID) -> Categoria:
        result = await self.db.execute(
            select(Categoria).where(
                and_(Categoria.id == categoria_id, Categoria.deleted_at.is_(None))
            )
        )
        categoria = result.scalar_one_or_none()
        if not categoria:
            raise NotFoundError("Categoria no encontrada.")
        if categoria.es_sistema or categoria.user_id != user_id:
            raise ForbiddenError("No puedes modificar esta categoria.")
        return categoria
