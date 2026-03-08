from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.categoria import CategoriaCreate, CategoriaResponse, CategoriaUpdate
from app.services import categorias as svc

router = APIRouter(prefix="/categorias", tags=["categorias"])


@router.get("", response_model=list[CategoriaResponse])
async def list_categorias(
    tipo: str | None = Query(None, description="ingreso | egreso | ambos"),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.list_categorias(token, tipo=tipo)


@router.post("", response_model=CategoriaResponse, status_code=201)
async def create_categoria(
    data: CategoriaCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_categoria(token, current_user["user_id"], data.model_dump())


@router.put("/{categoria_id}", response_model=CategoriaResponse)
async def update_categoria(
    categoria_id: str,
    data: CategoriaUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.update_categoria(
        token, categoria_id, data.model_dump(exclude_unset=True)
    )
    if not result:
        raise HTTPException(status_code=404, detail="Categoria no encontrada.")
    return result


@router.delete("/{categoria_id}", status_code=204)
async def delete_categoria(
    categoria_id: str,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_categoria(token, categoria_id)
