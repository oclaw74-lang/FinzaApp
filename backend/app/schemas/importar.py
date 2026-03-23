from decimal import Decimal
from datetime import date
from typing import List, Optional

from pydantic import BaseModel, field_validator


class TransaccionImport(BaseModel):
    tipo: str  # "egreso" | "ingreso"
    fecha: date
    monto: Decimal
    moneda: str = "DOP"
    descripcion: Optional[str] = None
    categoria_nombre: Optional[str] = None  # auto-matched to existing categories
    notas: Optional[str] = None

    @field_validator("tipo")
    @classmethod
    def tipo_must_be_valid(cls, v: str) -> str:
        if v not in ("egreso", "ingreso"):
            raise ValueError('tipo must be "egreso" or "ingreso"')
        return v

    @field_validator("monto")
    @classmethod
    def monto_must_be_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("monto must be greater than 0")
        return v


class ImportRequest(BaseModel):
    transacciones: List[TransaccionImport]


class FilaError(BaseModel):
    fila: int
    campo: str
    mensaje: str


class ImportResponse(BaseModel):
    importados: int
    errores: List[FilaError]
    duplicados_omitidos: int = 0
