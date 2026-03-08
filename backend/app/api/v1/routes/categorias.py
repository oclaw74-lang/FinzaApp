from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.schemas.categoria import CategoriaCreate, CategoriaResponse, CategoriaUpdate
from app.services.categorias import CategoriasService

router = APIRouter(prefix="/categorias", tags=["categorias"])


@router.get("", response_model=list[CategoriaResponse])
async def list_categorias(
    tipo: str | None = Query(None, description="ingreso | egreso | ambos"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> list[CategoriaResponse]:
    service = CategoriasService(db)
    return await service.list_for_user(
        user_id=UUID(current_user["user_id"]), tipo=tipo
    )


@router.post("", response_model=CategoriaResponse, status_code=201)
async def create_categoria(
    data: CategoriaCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> CategoriaResponse:
    service = CategoriasService(db)
    return await service.create(user_id=UUID(current_user["user_id"]), data=data)


@router.put("/{categoria_id}", response_model=CategoriaResponse)
async def update_categoria(
    categoria_id: UUID,
    data: CategoriaUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> CategoriaResponse:
    service = CategoriasService(db)
    return await service.update(
        categoria_id=categoria_id,
        user_id=UUID(current_user["user_id"]),
        data=data,
    )


@router.delete("/{categoria_id}", status_code=204)
async def delete_categoria(
    categoria_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
) -> None:
    service = CategoriasService(db)
    await service.soft_delete(
        categoria_id=categoria_id, user_id=UUID(current_user["user_id"])
    )
