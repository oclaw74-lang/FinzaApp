from fastapi import APIRouter, Depends

from app.core.security import get_current_user, get_raw_token
from app.schemas.importar import ImportRequest, ImportResponse
from app.services import importar as svc

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/transactions", response_model=ImportResponse, status_code=200)
async def import_transactions(
    data: ImportRequest,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> ImportResponse:
    return svc.bulk_import(token, current_user["user_id"], data.transacciones)
