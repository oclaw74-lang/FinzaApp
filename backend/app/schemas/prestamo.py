import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, computed_field, field_validator


TipoPrestamo = Literal["me_deben", "yo_debo"]
EstadoPrestamo = Literal["activo", "pagado", "vencido"]


class PrestamoCreate(BaseModel):
    tipo: TipoPrestamo
    persona: str
    monto_original: Decimal
    moneda: str = "DOP"
    fecha_prestamo: date
    fecha_vencimiento: date | None = None
    descripcion: str | None = None
    notas: str | None = None

    @field_validator("monto_original")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0.")
        return v

    @field_validator("persona")
    @classmethod
    def persona_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El nombre de la persona no puede estar vacio.")
        return v.strip()


class PrestamoUpdate(BaseModel):
    persona: str | None = None
    fecha_vencimiento: date | None = None
    descripcion: str | None = None
    notas: str | None = None
    estado: EstadoPrestamo | None = None

    @field_validator("persona")
    @classmethod
    def persona_must_not_be_empty(cls, v: str | None) -> str | None:
        if v is not None and not v.strip():
            raise ValueError("El nombre de la persona no puede estar vacio.")
        return v.strip() if v else v


class PagoPrestamoCreate(BaseModel):
    monto: Decimal
    fecha: date
    notas: str | None = None

    @field_validator("monto")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0.")
        return v


class PagoPrestamoResponse(BaseModel):
    id: uuid.UUID
    prestamo_id: uuid.UUID
    user_id: uuid.UUID
    monto: Decimal
    fecha: date
    notas: str | None
    created_at: datetime
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}


class PrestamoResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tipo: str
    persona: str
    monto_original: Decimal
    monto_pendiente: Decimal
    moneda: str
    fecha_prestamo: date
    fecha_vencimiento: date | None
    descripcion: str | None
    estado: str
    notas: str | None
    created_at: datetime
    updated_at: datetime
    pagos: list[PagoPrestamoResponse] = []

    @computed_field
    @property
    def porcentaje_pagado(self) -> float:
        if self.monto_original == 0:
            return 0.0
        pagado = self.monto_original - self.monto_pendiente
        return round(float(pagado / self.monto_original) * 100, 2)

    model_config = {"from_attributes": True}


class PrestamoResumen(BaseModel):
    total_me_deben: float
    total_yo_debo: float
    cantidad_activos: int
    cantidad_vencidos: int
