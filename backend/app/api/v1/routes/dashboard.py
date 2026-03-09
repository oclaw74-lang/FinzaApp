from datetime import date

from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user, get_raw_token
from app.schemas.dashboard import DashboardResponse
from app.services import dashboard_service

router = APIRouter()


@router.get("/dashboard", response_model=DashboardResponse, tags=["dashboard"])
async def get_dashboard_endpoint(
    mes: int | None = Query(default=None, ge=1, le=12, description="Month (1-12)"),
    year: int | None = Query(default=None, ge=2000, le=2100, description="Year"),
    current_user: dict = Depends(get_current_user),
    token: str = Depends(get_raw_token),
) -> dict:
    today = date.today()
    resolved_mes = mes if mes is not None else today.month
    resolved_year = year if year is not None else today.year
    return dashboard_service.get_dashboard(
        user_jwt=token,
        user_id=current_user["user_id"],
        mes=resolved_mes,
        year=resolved_year,
    )
