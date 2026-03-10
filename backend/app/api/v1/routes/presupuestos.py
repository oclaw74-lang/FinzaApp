from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.presupuesto import (
    PresupuestoCreate,
    PresupuestoEstado,
    PresupuestoResponse,
    PresupuestoUpdate,
)
from app.services import presupuestos as svc

router = APIRouter(prefix="/presupuestos", tags=["presupuestos"])


@router.get("", response_model=list[PresupuestoResponse])
async def list_presupuestos(
    mes: int | None = Query(None, ge=1, le=12, description="Filtrar por mes (1-12)"),
    year: int | None = Query(None, ge=2000, description="Filtrar por año"),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_presupuestos(user_jwt=token, mes=mes, year=year)


@router.post("", response_model=PresupuestoResponse, status_code=201)
async def create_presupuesto(
    data: PresupuestoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_presupuesto(user_jwt=token, data=data)


# IMPORTANTE: /estado debe ir ANTES de /{presupuesto_id} para evitar que el
# path param capture la cadena literal "estado"
@router.get("/estado", response_model=list[PresupuestoEstado])
async def get_estado(
    mes: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    year: int = Query(..., ge=2000, description="Año"),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_estado_presupuestos(user_jwt=token, mes=mes, year=year)


@router.get("/{presupuesto_id}", response_model=PresupuestoResponse)
async def get_presupuesto(
    presupuesto_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_presupuesto_by_id(user_jwt=token, presupuesto_id=str(presupuesto_id))


@router.put("/{presupuesto_id}", response_model=PresupuestoResponse)
async def update_presupuesto(
    presupuesto_id: UUID,
    data: PresupuestoUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_presupuesto(
        user_jwt=token,
        presupuesto_id=str(presupuesto_id),
        data=data,
    )


@router.delete("/{presupuesto_id}", status_code=204)
async def delete_presupuesto(
    presupuesto_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_presupuesto(user_jwt=token, presupuesto_id=str(presupuesto_id))
