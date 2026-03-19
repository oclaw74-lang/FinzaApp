from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.recurrente import (
    ProximoVencimientoResponse,
    RecurrenteCreate,
    RecurrenteResponse,
    RecurrenteUpdate,
)
from app.services import recurrentes as svc

router = APIRouter(prefix="/recurrentes", tags=["recurrentes"])


@router.get("", response_model=list[RecurrenteResponse])
async def list_recurrentes(
    activo: bool | None = Query(None, description="Filtrar por estado activo"),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_recurrentes(user_jwt=token, activo=activo)


@router.post("", response_model=RecurrenteResponse, status_code=201)
async def create_recurrente(
    data: RecurrenteCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_recurrente(
        user_jwt=token,
        user_id=current_user["user_id"],
        data=data,
    )


# IMPORTANTE: /proximos debe ir ANTES de /{recurrente_id} para evitar que el
# path param capture la cadena literal "proximos"
@router.get("/proximos", response_model=list[ProximoVencimientoResponse])
async def get_proximos(
    mes: int = Query(..., ge=1, le=12, description="Mes (1-12)"),
    year: int = Query(..., ge=2000, description="Anio"),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_proximos_mes(user_jwt=token, mes=mes, year=year)


@router.get("/{recurrente_id}", response_model=RecurrenteResponse)
async def get_recurrente(
    recurrente_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_recurrente_by_id(user_jwt=token, recurrente_id=str(recurrente_id))


@router.put("/{recurrente_id}", response_model=RecurrenteResponse)
async def update_recurrente(
    recurrente_id: UUID,
    data: RecurrenteUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_recurrente(
        user_jwt=token,
        recurrente_id=str(recurrente_id),
        data=data,
    )


@router.delete("/{recurrente_id}", status_code=204)
async def delete_recurrente(
    recurrente_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_recurrente(user_jwt=token, recurrente_id=str(recurrente_id))
