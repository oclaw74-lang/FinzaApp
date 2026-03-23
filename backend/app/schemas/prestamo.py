import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, computed_field, field_validator, model_validator


TipoPrestamo = Literal["me_deben", "yo_debo"]
EstadoPrestamo = Literal["activo", "pagado", "vencido", "cancelado"]
AcreeedorTipo = Literal["persona", "banco"]


class PrestamoCreate(BaseModel):
    tipo: TipoPrestamo
    acreedor_tipo: AcreeedorTipo = "persona"
    persona: str | None = None  # person name or bank name
    monto_original: Decimal
    moneda: str = "DOP"
    fecha_prestamo: date
    fecha_vencimiento: date | None = None
    descripcion: str | None = None
    notas: str | None = None
    tasa_interes: Decimal | None = None  # % annual, e.g. 18.5
    plazo_meses: int | None = None        # number of installments
    monto_ya_pagado: Decimal = Decimal("0")  # for historical loans already partially paid

    @field_validator("monto_original")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("El monto debe ser mayor a 0.")
        return v

    @field_validator("monto_ya_pagado")
    @classmethod
    def monto_ya_pagado_must_be_non_negative(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("El monto ya pagado no puede ser negativo.")
        return v

    @model_validator(mode="after")
    def validate_persona_not_empty(self) -> "PrestamoCreate":
        if not self.persona or not self.persona.strip():
            raise ValueError("El nombre del acreedor no puede estar vacio.")
        self.persona = self.persona.strip()
        return self


class PrestamoUpdate(BaseModel):
    acreedor_tipo: AcreeedorTipo | None = None
    persona: str | None = None
    fecha_vencimiento: date | None = None
    descripcion: str | None = None
    notas: str | None = None
    estado: EstadoPrestamo | None = None
    tasa_interes: Decimal | None = None  # % annual, e.g. 18.5
    plazo_meses: int | None = None        # number of installments

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
    monto_capital: Decimal | None = None   # capital portion of this payment
    monto_interes: Decimal | None = None   # interest portion of this payment
    numero_cuota: int | None = None        # installment number in amortization schedule

    model_config = {"from_attributes": True}


class PrestamoResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tipo: str
    acreedor_tipo: str = "persona"
    persona: str
    monto_original: Decimal
    monto_pendiente: Decimal
    monto_ya_pagado: Decimal = Decimal("0")
    moneda: str
    fecha_prestamo: date
    fecha_vencimiento: date | None
    descripcion: str | None
    estado: str
    notas: str | None
    created_at: datetime
    updated_at: datetime
    pagos: list[PagoPrestamoResponse] = []
    tasa_interes: Decimal | None = None
    plazo_meses: int | None = None
    cuota_mensual: float | None = None      # calculated by service
    total_intereses: float | None = None    # calculated by service
    proximo_pago: date | None = None        # calculated by service

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
