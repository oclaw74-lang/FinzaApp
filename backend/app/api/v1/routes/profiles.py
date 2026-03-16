from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
from app.schemas.profile import ProfileResponse, ProfileUpdate
from app.services import profiles as svc

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.get_or_create_profile(user_jwt=token, user_id=current_user["user_id"])


@router.patch("/me", response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    return svc.update_profile(user_jwt=token, user_id=current_user["user_id"], data=data)
