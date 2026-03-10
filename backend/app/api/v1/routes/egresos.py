from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.common import PaginatedResponse
from app.schemas.egreso import EgresoCreate, EgresoResponse, EgresoUpdate
from app.services import egresos as svc

router = APIRouter(prefix="/egresos", tags=["egresos"])


@router.get("", response_model=PaginatedResponse[EgresoResponse])
async def list_egresos(
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    categoria_id: UUID | None = Query(None),
    moneda: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=500),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.list_egresos(
        user_jwt=token,
        user_id=current_user["user_id"],
        fecha_desde=str(fecha_desde) if fecha_desde else None,
        fecha_hasta=str(fecha_hasta) if fecha_hasta else None,
        categoria_id=str(categoria_id) if categoria_id else None,
        moneda=moneda,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=EgresoResponse, status_code=201)
async def create_egreso(
    data: EgresoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    payload = data.model_dump()
    payload["categoria_id"] = str(payload["categoria_id"])
    if payload.get("subcategoria_id"):
        payload["subcategoria_id"] = str(payload["subcategoria_id"])
    payload["fecha"] = str(payload["fecha"])
    payload["monto"] = str(payload["monto"])
    return svc.create_egreso(token, current_user["user_id"], payload)


@router.get("/{egreso_id}", response_model=EgresoResponse)
async def get_egreso(
    egreso_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.get_egreso(token, str(egreso_id), current_user["user_id"])
    if not result:
        raise HTTPException(status_code=404, detail="Egreso no encontrado.")
    return result


@router.put("/{egreso_id}", response_model=EgresoResponse)
async def update_egreso(
    egreso_id: UUID,
    data: EgresoUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    payload = data.model_dump(exclude_unset=True)
    if "categoria_id" in payload and payload["categoria_id"]:
        payload["categoria_id"] = str(payload["categoria_id"])
    if "fecha" in payload and payload["fecha"]:
        payload["fecha"] = str(payload["fecha"])
    if "monto" in payload and payload["monto"] is not None:
        payload["monto"] = str(payload["monto"])
    result = svc.update_egreso(token, str(egreso_id), current_user["user_id"], payload)
    if not result:
        raise HTTPException(status_code=404, detail="Egreso no encontrado.")
    return result


@router.delete("/{egreso_id}", status_code=204)
async def delete_egreso(
    egreso_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    # Service raises HTTPException 404 if record does not exist
    svc.delete_egreso(token, str(egreso_id), current_user["user_id"])
