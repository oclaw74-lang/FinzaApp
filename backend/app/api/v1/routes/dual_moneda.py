from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
from app.schemas.dual_moneda import DualMonedaConfig, DualMonedaUpdate
from app.services import dual_moneda as svc

router = APIRouter(prefix="/config/dual-moneda", tags=["dual-moneda"])


@router.get("", response_model=DualMonedaConfig)
async def get_dual_moneda(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> DualMonedaConfig:
    return svc.get_dual_moneda_config(token, current_user["user_id"])


@router.put("", response_model=DualMonedaConfig)
async def update_dual_moneda(
    data: DualMonedaUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> DualMonedaConfig:
    return svc.update_dual_moneda_config(token, current_user["user_id"], data)
