from typing import Optional

from pydantic import BaseModel, Field


class SuscripcionCreate(BaseModel):
    nombre: str
    monto: float = Field(gt=0)
    frecuencia: str
    moneda: str = "DOP"
    categoria_id: Optional[str] = None
    fecha_proximo_cobro: Optional[str] = None
    notas: Optional[str] = None


class SuscripcionUpdate(BaseModel):
    nombre: Optional[str] = None
    monto: Optional[float] = Field(None, gt=0)
    frecuencia: Optional[str] = None
    moneda: Optional[str] = None
    categoria_id: Optional[str] = None
    fecha_proximo_cobro: Optional[str] = None
    activa: Optional[bool] = None
    notas: Optional[str] = None


class CandidatoConfirmado(BaseModel):
    nombre: str
    monto: float = Field(gt=0)
    frecuencia: str = "mensual"
    moneda: str = "DOP"
    categoria_id: Optional[str] = None


class ConfirmarDetectadasRequest(BaseModel):
    candidatos: list[CandidatoConfirmado]


class SuscripcionResponse(BaseModel):
    id: str
    nombre: str
    monto: float
    monto_mensual: float
    frecuencia: str
    moneda: str
    activa: bool
    auto_detectada: bool
    fecha_proximo_cobro: Optional[str]
    notas: Optional[str]
    categoria_id: Optional[str] = None

    model_config = {"from_attributes": True}


class SuscripcionResumenResponse(BaseModel):
    total_mensual: float
    total_anual: float
    cantidad_activas: int
    suscripciones: list[SuscripcionResponse]
