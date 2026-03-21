import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field, field_validator

TipoTarjeta = Literal["credito", "debito"]
RedTarjeta = Literal["visa", "mastercard", "amex", "discover", "otro"]


class TarjetaCreate(BaseModel):
    banco: str
    banco_id: Optional[str] = None
    banco_custom: Optional[str] = None
    titular: Optional[str] = None  # defaults to user email in service if not provided
    ultimos_digitos: str = Field(min_length=4, max_length=4)
    tipo: TipoTarjeta
    red: RedTarjeta
    limite_credito: Optional[float] = None
    saldo_actual: float = 0.0
    fecha_corte: Optional[int] = Field(default=None, ge=1, le=31)
    fecha_pago: Optional[int] = Field(default=None, ge=1, le=31)
    color: Optional[str] = None
    activa: bool = True
    bloqueada: bool = False
    moneda: str = "DOP"

    @field_validator("banco")
    @classmethod
    def banco_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("El banco no puede estar vacio.")
        return v.strip()

    @field_validator("titular")
    @classmethod
    def titular_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("El titular no puede estar vacio.")
        return v.strip() if v else v

    @field_validator("ultimos_digitos")
    @classmethod
    def digitos_only_numeric(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("ultimos_digitos debe contener solo numeros.")
        return v

    @field_validator("saldo_actual")
    @classmethod
    def saldo_not_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("El saldo actual no puede ser negativo.")
        return v

    @field_validator("limite_credito")
    @classmethod
    def limite_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("El limite de credito debe ser mayor a 0.")
        return v


class TarjetaUpdate(BaseModel):
    banco: Optional[str] = None
    banco_id: Optional[uuid.UUID] = None
    banco_custom: Optional[str] = None
    titular: Optional[str] = None
    tipo: Optional[TipoTarjeta] = None
    red: Optional[RedTarjeta] = None
    limite_credito: Optional[float] = None
    saldo_actual: Optional[float] = None
    fecha_corte: Optional[int] = Field(default=None, ge=1, le=31)
    fecha_pago: Optional[int] = Field(default=None, ge=1, le=31)
    color: Optional[str] = None
    activa: Optional[bool] = None
    bloqueada: Optional[bool] = None

    # Allow clearing banco by passing null banco_id; allow empty-string banco in updates
    @field_validator("banco")
    @classmethod
    def banco_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v.strip() == "" and v != "":
            raise ValueError("El banco no puede estar vacio.")
        return v.strip() if v else v

    @field_validator("titular")
    @classmethod
    def titular_not_empty(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("El titular no puede estar vacio.")
        return v.strip() if v else v

    @field_validator("saldo_actual")
    @classmethod
    def saldo_not_negative(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v < 0:
            raise ValueError("El saldo actual no puede ser negativo.")
        return v

    @field_validator("limite_credito")
    @classmethod
    def limite_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("El limite de credito debe ser mayor a 0.")
        return v


class MovimientoTarjetaCreate(BaseModel):
    tipo: Literal["compra", "pago", "deposito"]
    monto: Decimal = Field(gt=0)
    descripcion: Optional[str] = None
    fecha: date
    categoria_id: Optional[uuid.UUID] = None  # optional for all tipos
    notas: Optional[str] = None


class MovimientoTarjetaResponse(BaseModel):
    id: uuid.UUID
    tarjeta_id: uuid.UUID
    tipo: str
    monto: Decimal
    descripcion: Optional[str] = None
    fecha: date
    egreso_id: Optional[uuid.UUID] = None
    ingreso_id: Optional[uuid.UUID] = None
    notas: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TarjetaResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    banco: str
    banco_id: Optional[str] = None
    banco_custom: Optional[str] = None
    titular: Optional[str] = None
    ultimos_digitos: str
    tipo: str
    red: str
    limite_credito: Optional[float] = None
    saldo_actual: float
    fecha_corte: Optional[int] = None
    fecha_pago: Optional[int] = None
    color: Optional[str] = None
    activa: bool
    bloqueada: bool = False
    disponible: Optional[float] = None  # computed: limite_credito - saldo_actual
    moneda: str = "DOP"

    model_config = {"from_attributes": True}
