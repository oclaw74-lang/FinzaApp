import uuid
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, field_validator


class EgresoCreate(BaseModel):
    categoria_id: uuid.UUID
    subcategoria_id: uuid.UUID | None = None
    monto: Decimal
    moneda: str = "DOP"
    descripcion: str | None = None
    metodo_pago: str = "efectivo"
    fecha: date
    notas: str | None = None

    @field_validator("monto")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0.")
        return v


class EgresoUpdate(BaseModel):
    categoria_id: uuid.UUID | None = None
    monto: Decimal | None = None
    descripcion: str | None = None
    metodo_pago: str | None = None
    fecha: date | None = None
    notas: str | None = None


class EgresoResponse(BaseModel):
    id: uuid.UUID
    categoria_id: uuid.UUID
    subcategoria_id: uuid.UUID | None
    monto: Decimal
    moneda: str
    descripcion: str | None
    metodo_pago: str
    fecha: date
    notas: str | None

    model_config = {"from_attributes": True}
