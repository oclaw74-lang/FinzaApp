from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
from app.schemas.prediccion import PrediccionMesResponse
import app.services.prediccion as svc

router = APIRouter(prefix="/prediccion", tags=["prediccion"])


@router.get("/mes", response_model=PrediccionMesResponse)
async def get_prediccion_mes_endpoint(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get end-of-month financial projection based on current spending rate."""
    return svc.get_prediccion_mes(user_jwt=token, user_id=current_user["user_id"])
