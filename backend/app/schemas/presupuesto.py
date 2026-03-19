from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class PresupuestoCreate(BaseModel):
    categoria_id: UUID
    mes: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2000)
    monto_limite: float = Field(..., gt=0)
    aplicar_todos_los_meses: bool = False


class PresupuestoUpdate(BaseModel):
    monto_limite: float = Field(..., gt=0)


class PresupuestoResponse(BaseModel):
    id: UUID
    user_id: UUID
    categoria_id: UUID
    mes: int
    year: int
    monto_limite: float
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PresupuestoEstado(BaseModel):
    """Presupuesto con gasto real calculado del mes."""

    id: UUID
    categoria_id: UUID
    categoria_nombre: str
    mes: int
    year: int
    monto_limite: float
    gasto_actual: float
    porcentaje_usado: float
    alerta: bool  # True si porcentaje_usado >= 80

    model_config = {"from_attributes": True}
