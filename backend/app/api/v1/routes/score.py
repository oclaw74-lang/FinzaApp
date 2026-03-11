from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
from app.schemas.score import ScoreResponse
import app.services.score as svc

router = APIRouter(prefix="/score", tags=["score"])


@router.get("", response_model=ScoreResponse)
async def get_financial_score(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Get the financial health score (0-100) for the authenticated user."""
    return svc.get_score(user_jwt=token, user_id=current_user["user_id"])
