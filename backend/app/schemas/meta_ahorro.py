import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, field_validator


EstadoMeta = Literal["activa", "completada", "cancelada"]
TipoContribucion = Literal["deposito", "retiro"]


class MetaAhorroCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    monto_objetivo: Decimal
    fecha_inicio: date = date.today()
    fecha_objetivo: date | None = None
    estado: EstadoMeta = "activa"
    color: str | None = None
    icono: str | None = None

    @field_validator("monto_objetivo")
    @classmethod
    def monto_objetivo_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto objetivo debe ser mayor a 0.")
        return v

    @field_validator("nombre")
    @classmethod
    def nombre_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre no puede estar vacio.")
        return v.strip()


class MetaAhorroUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    monto_objetivo: Decimal | None = None
    fecha_objetivo: date | None = None
    estado: EstadoMeta | None = None
    color: str | None = None
    icono: str | None = None

    @field_validator("monto_objetivo")
    @classmethod
    def monto_objetivo_must_be_positive(cls, v: Decimal | None) -> Decimal | None:
        if v is not None and v <= 0:
            raise ValueError("El monto objetivo debe ser mayor a 0.")
        return v

    @field_validator("nombre")
    @classmethod
    def nombre_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("El nombre no puede estar vacio.")
        return v.strip() if v else v


class MetaAhorroResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    nombre: str
    descripcion: str | None
    monto_objetivo: Decimal
    monto_actual: Decimal
    fecha_inicio: date
    fecha_objetivo: date | None
    estado: str
    color: str | None
    icono: str | None
    created_at: datetime
    updated_at: datetime

    @property
    def porcentaje_cumplimiento(self) -> float:
        if self.monto_objetivo == 0:
            return 0.0
        return round(float(self.monto_actual / self.monto_objetivo) * 100, 2)

    model_config = {"from_attributes": True}


class ContribucionMetaCreate(BaseModel):
    monto: Decimal
    tipo: TipoContribucion
    fecha: date = date.today()
    notas: str | None = None

    @field_validator("monto")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0.")
        return v


class ContribucionMetaResponse(BaseModel):
    id: uuid.UUID
    meta_id: uuid.UUID
    monto: Decimal
    tipo: str
    fecha: date
    notas: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class MetasResumen(BaseModel):
    total_ahorrado: Decimal
    metas_activas: int
    metas_completadas: int
    porcentaje_promedio_cumplimiento: float
