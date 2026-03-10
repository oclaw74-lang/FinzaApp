from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.common import PaginatedResponse
from app.schemas.ingreso import IngresoCreate, IngresoResponse, IngresoUpdate
from app.services import ingresos as svc

router = APIRouter(prefix="/ingresos", tags=["ingresos"])


@router.get("", response_model=PaginatedResponse[IngresoResponse])
async def list_ingresos(
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    categoria_id: UUID | None = Query(None),
    moneda: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.list_ingresos(
        user_jwt=token,
        user_id=current_user["user_id"],
        fecha_desde=str(fecha_desde) if fecha_desde else None,
        fecha_hasta=str(fecha_hasta) if fecha_hasta else None,
        categoria_id=str(categoria_id) if categoria_id else None,
        moneda=moneda,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=IngresoResponse, status_code=201)
async def create_ingreso(
    data: IngresoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    payload = data.model_dump()
    payload["categoria_id"] = str(payload["categoria_id"])
    if payload.get("subcategoria_id"):
        payload["subcategoria_id"] = str(payload["subcategoria_id"])
    payload["fecha"] = str(payload["fecha"])
    payload["monto"] = str(payload["monto"])
    return svc.create_ingreso(token, current_user["user_id"], payload)


@router.get("/{ingreso_id}", response_model=IngresoResponse)
async def get_ingreso(
    ingreso_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.get_ingreso(token, str(ingreso_id), current_user["user_id"])
    if not result:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
    return result


@router.put("/{ingreso_id}", response_model=IngresoResponse)
async def update_ingreso(
    ingreso_id: UUID,
    data: IngresoUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    payload = data.model_dump(exclude_unset=True)
    if "categoria_id" in payload and payload["categoria_id"]:
        payload["categoria_id"] = str(payload["categoria_id"])
    if "subcategoria_id" in payload and payload["subcategoria_id"]:
        payload["subcategoria_id"] = str(payload["subcategoria_id"])
    if "fecha" in payload and payload["fecha"]:
        payload["fecha"] = str(payload["fecha"])
    if "monto" in payload and payload["monto"] is not None:
        payload["monto"] = str(payload["monto"])
    result = svc.update_ingreso(token, str(ingreso_id), current_user["user_id"], payload)
    if not result:
        raise HTTPException(status_code=404, detail="Ingreso no encontrado.")
    return result


@router.delete("/{ingreso_id}", status_code=204)
async def delete_ingreso(
    ingreso_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    # Service raises HTTPException 404 if record does not exist
    svc.delete_ingreso(token, str(ingreso_id), current_user["user_id"])
