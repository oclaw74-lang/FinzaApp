from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
import app.services.comparativa as svc

router = APIRouter(prefix="/dashboard", tags=["comparativa"])


@router.get("/comparativa-deuda-ahorro")
async def get_comparativa(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
):
    return svc.get_comparativa(user_jwt=token, user_id=current_user["user_id"])
