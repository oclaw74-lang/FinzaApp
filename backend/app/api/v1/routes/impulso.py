from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.impulso import (
    ImpulsoClasificarRequest,
    ImpulsoEvalResponse,
    ImpulsoResumenResponse,
)
from app.services import impulso as svc

router = APIRouter(tags=["impulso"])


@router.post("/egresos/evaluar-impulsos", response_model=ImpulsoEvalResponse)
async def evaluar_impulsos(
    mes: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.evaluar_impulsos(
        user_jwt=token, user_id=current_user["user_id"], mes=mes, year=year
    )


@router.patch("/egresos/{egreso_id}/clasificar-impulso")
async def clasificar_impulso(
    egreso_id: str,
    body: ImpulsoClasificarRequest,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.clasificar_impulso(
        user_jwt=token,
        user_id=current_user["user_id"],
        egreso_id=egreso_id,
        es_impulso=body.es_impulso,
    )


@router.get("/egresos/resumen-impulso", response_model=ImpulsoResumenResponse)
async def get_resumen_impulso(
    mes: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_resumen_impulso(
        user_jwt=token, user_id=current_user["user_id"], mes=mes, year=year
    )
