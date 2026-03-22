from datetime import date
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class RecurrenteBase(BaseModel):
    tipo: Literal["ingreso", "egreso"]
    descripcion: str = Field(..., min_length=1, max_length=255)
    monto: float = Field(..., gt=0)
    moneda: str = "DOP"
    categoria_id: Optional[UUID] = None
    frecuencia: Literal["diaria", "semanal", "quincenal", "mensual"]
    dia_del_mes: Optional[int] = Field(None, ge=1, le=31)
    fecha_inicio: date
    fecha_fin: Optional[date] = None


class RecurrenteCreate(RecurrenteBase):
    pass


class RecurrenteUpdate(BaseModel):
    descripcion: Optional[str] = Field(None, min_length=1, max_length=255)
    monto: Optional[float] = Field(None, gt=0)
    moneda: Optional[str] = None
    categoria_id: Optional[UUID] = None
    frecuencia: Optional[Literal["diaria", "semanal", "quincenal", "mensual"]] = None
    dia_del_mes: Optional[int] = Field(None, ge=1, le=31)
    activo: Optional[bool] = None
    fecha_fin: Optional[date] = None


class RecurrenteResponse(RecurrenteBase):
    id: UUID
    user_id: UUID
    activo: bool
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ProximoVencimientoResponse(BaseModel):
    """Recurrente con su fecha estimada de ejecucion en el mes consultado."""

    recurrente: RecurrenteResponse
    fecha_estimada: date
