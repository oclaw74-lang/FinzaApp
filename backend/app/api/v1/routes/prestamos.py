from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.prestamo import (
    PagoPrestamoCreate,
    PagoPrestamoResponse,
    PrestamoCreate,
    PrestamoResumen,
    PrestamoResponse,
    PrestamoUpdate,
)
from app.services import prestamos as svc

router = APIRouter(prefix="/prestamos", tags=["prestamos"])


@router.get("", response_model=list[PrestamoResponse])
async def list_prestamos(
    tipo: str | None = Query(None, description="Filtrar por tipo: me_deben o yo_debo"),
    estado: str | None = Query(
        None, description="Filtrar por estado: activo, pagado, vencido"
    ),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_prestamos(
        user_jwt=token,
        user_id=current_user["user_id"],
        tipo=tipo,
        estado=estado,
    )


@router.post("", response_model=PrestamoResponse, status_code=201)
async def create_prestamo(
    data: PrestamoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.create_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        data=data,
    )
    result.setdefault("pagos", [])
    return result


@router.get("/resumen", response_model=PrestamoResumen)
async def get_resumen(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_resumen(
        user_jwt=token,
        user_id=current_user["user_id"],
    )


@router.get("/{prestamo_id}", response_model=PrestamoResponse)
async def get_prestamo(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.get_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    return result


@router.put("/{prestamo_id}", response_model=PrestamoResponse)
async def update_prestamo(
    prestamo_id: UUID,
    data: PrestamoUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.update_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
        data=data,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Prestamo no encontrado.")
    result.setdefault("pagos", [])
    return result


@router.delete("/{prestamo_id}", status_code=204)
async def delete_prestamo(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_prestamo(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
    )


@router.get("/{prestamo_id}/pagos", response_model=list[PagoPrestamoResponse])
async def list_pagos(
    prestamo_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_pagos(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
    )


@router.post(
    "/{prestamo_id}/pagos",
    response_model=dict,
    status_code=201,
)
async def registrar_pago(
    prestamo_id: UUID,
    data: PagoPrestamoCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.registrar_pago(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
        data=data,
    )


@router.delete("/{prestamo_id}/pagos/{pago_id}", status_code=204)
async def delete_pago(
    prestamo_id: UUID,
    pago_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_pago(
        user_jwt=token,
        user_id=current_user["user_id"],
        prestamo_id=str(prestamo_id),
        pago_id=str(pago_id),
    )
