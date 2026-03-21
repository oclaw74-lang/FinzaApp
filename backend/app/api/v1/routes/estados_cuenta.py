from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile

from app.core.security import get_current_user, get_raw_token
from app.schemas.estado_cuenta import EstadoCuentaResponse
from app.services import estado_cuenta as svc

router = APIRouter(prefix="/estados-cuenta", tags=["estados-cuenta"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}


@router.post("/upload", response_model=EstadoCuentaResponse, status_code=201)
async def upload_estado_cuenta(
    file: UploadFile = File(...),
    tarjeta_id: Optional[UUID] = Form(None),
    fecha_estado: Optional[str] = Form(None),
    monto_total: Optional[float] = Form(None),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> dict:
    """Upload a credit card bank statement (PDF or image, max 10 MB)."""
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=422,
            detail="Tipo de archivo no permitido. Solo PDF, JPEG o PNG.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=422,
            detail="Archivo demasiado grande. Maximo 10MB.",
        )

    return svc.upload_estado_cuenta(
        user_jwt=token,
        user_id=current_user["user_id"],
        file_bytes=file_bytes,
        filename=file.filename or "estado_cuenta",
        content_type=file.content_type,
        tarjeta_id=str(tarjeta_id) if tarjeta_id else None,
        fecha_estado=fecha_estado,
        monto_total=monto_total,
    )


@router.get("/", response_model=list[EstadoCuentaResponse])
async def list_estados_cuenta(
    tarjeta_id: Optional[UUID] = Query(None),
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> list[dict]:
    """List all estados_cuenta for the authenticated user."""
    return svc.list_estados_cuenta(
        user_jwt=token,
        user_id=current_user["user_id"],
        tarjeta_id=str(tarjeta_id) if tarjeta_id else None,
    )


@router.delete("/{estado_id}", status_code=204)
async def delete_estado_cuenta(
    estado_id: UUID,
    token: str = Depends(get_raw_token),
    current_user: dict = Depends(get_current_user),
) -> None:
    """Soft-delete an estado_cuenta."""
    svc.delete_estado_cuenta(
        user_jwt=token,
        user_id=current_user["user_id"],
        estado_id=str(estado_id),
    )
