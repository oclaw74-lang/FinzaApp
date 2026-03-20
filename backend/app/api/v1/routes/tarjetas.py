from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.tarjeta import (
    MovimientoTarjetaCreate,
    MovimientoTarjetaResponse,
    TarjetaCreate,
    TarjetaResponse,
    TarjetaUpdate,
)
from app.services import movimientos_tarjeta as movimientos_svc
from app.services import tarjetas as svc

router = APIRouter(prefix="/tarjetas", tags=["tarjetas"])


@router.get("", response_model=list[TarjetaResponse])
async def list_tarjetas(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return svc.get_tarjetas(
        user_jwt=token,
        user_id=current_user["user_id"],
    )


@router.get("/{tarjeta_id}", response_model=TarjetaResponse)
async def get_tarjeta(
    tarjeta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.get_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    return result


@router.post("", response_model=TarjetaResponse, status_code=201)
async def create_tarjeta(
    data: TarjetaCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.create_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        data=data,
        user_email=current_user.get("email"),
    )


@router.put("/{tarjeta_id}", response_model=TarjetaResponse)
async def update_tarjeta(
    tarjeta_id: UUID,
    data: TarjetaUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.update_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
        data=data,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    return result


@router.delete("/{tarjeta_id}", status_code=204)
async def delete_tarjeta(
    tarjeta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    svc.delete_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
    )


@router.patch("/{tarjeta_id}/bloquear", response_model=TarjetaResponse)
async def toggle_bloquear_tarjeta(
    tarjeta_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    result = svc.toggle_bloquear_tarjeta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
    )
    if not result:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada.")
    return result


# ---------------------------------------------------------------------------
# Movimientos de tarjeta (compras y pagos)
# ---------------------------------------------------------------------------

@router.post(
    "/{tarjeta_id}/movimientos",
    response_model=dict,
    status_code=201,
)
async def registrar_movimiento_tarjeta(
    tarjeta_id: UUID,
    data: MovimientoTarjetaCreate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return movimientos_svc.registrar_movimiento(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
        tipo=data.tipo,
        monto=float(data.monto),
        fecha=data.fecha,
        descripcion=data.descripcion,
        categoria_id=str(data.categoria_id) if data.categoria_id else None,
        notas=data.notas,
    )


@router.get(
    "/{tarjeta_id}/movimientos",
    response_model=list[MovimientoTarjetaResponse],
)
async def list_movimientos_tarjeta(
    tarjeta_id: UUID,
    tipo: str | None = Query(None, description="Filtrar por tipo: compra o pago"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    return movimientos_svc.get_movimientos(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
        tipo=tipo,
        limit=limit,
        offset=offset,
    )


@router.delete("/{tarjeta_id}/movimientos/{movimiento_id}", status_code=204)
async def delete_movimiento_tarjeta(
    tarjeta_id: UUID,
    movimiento_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    movimientos_svc.delete_movimiento(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id),
        movimiento_id=str(movimiento_id),
    )
