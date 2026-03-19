from pydantic import BaseModel
from typing import Optional


class ItemComparativa(BaseModel):
    nombre: str
    tipo: str  # "deuda" | "ahorro"
    monto: float
    tasa_anual: Optional[float] = None
    costo_o_rendimiento_mensual: float


class ComparativaResponse(BaseModel):
    deudas: list[ItemComparativa]
    ahorros: list[ItemComparativa]
    total_costo_deuda: float
    total_rendimiento_ahorro: float
    diferencia: float  # positivo = deuda > ahorro -> conviene pagar deuda
    recomendacion: str
