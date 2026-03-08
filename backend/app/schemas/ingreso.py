import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator


class IngresoCreate(BaseModel):
    categoria_id: uuid.UUID
    subcategoria_id: uuid.UUID | None = None
    monto: Decimal
    moneda: str = "DOP"
    descripcion: str | None = None
    fuente: str | None = None
    fecha: date
    notas: str | None = None

    @field_validator("monto")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0.")
        return v


class IngresoUpdate(BaseModel):
    categoria_id: uuid.UUID | None = None
    subcategoria_id: uuid.UUID | None = None
    monto: Decimal | None = None
    descripcion: str | None = None
    fuente: str | None = None
    fecha: date | None = None
    notas: str | None = None


class IngresoResponse(BaseModel):
    id: uuid.UUID
    categoria_id: uuid.UUID
    subcategoria_id: uuid.UUID | None
    monto: Decimal
    moneda: str
    descripcion: str | None
    fuente: str | None
    fecha: date
    notas: str | None

    model_config = {"from_attributes": True}


class IngresoFilter(BaseModel):
    fecha_desde: date | None = None
    fecha_hasta: date | None = None
    categoria_id: uuid.UUID | None = None
    moneda: str | None = None
