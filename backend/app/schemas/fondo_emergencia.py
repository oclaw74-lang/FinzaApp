from typing import Optional

from pydantic import BaseModel, Field


class FondoEmergenciaCreate(BaseModel):
    monto_actual: float = Field(default=0, ge=0)
    meta_meses: int = Field(default=3)
    notas: Optional[str] = None


class FondoEmergenciaUpdate(BaseModel):
    monto_actual: Optional[float] = Field(None, ge=0)
    meta_meses: Optional[int] = None
    notas: Optional[str] = None


class MontoRequest(BaseModel):
    monto: float = Field(gt=0)


class FondoEmergenciaResponse(BaseModel):
    id: str
    user_id: str
    monto_actual: float
    meta_meses: int
    meta_calculada: Optional[float]
    porcentaje: float
    notas: Optional[str]

    model_config = {"from_attributes": True}
