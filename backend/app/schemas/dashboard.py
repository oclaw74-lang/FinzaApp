import uuid
from typing import Literal

from pydantic import BaseModel


class KPIs(BaseModel):
    total_ingresos: float
    total_egresos: float
    balance: float
    ahorro_estimado: float


class CategoriaBreakdown(BaseModel):
    categoria_id: uuid.UUID | None
    nombre: str
    tipo: Literal["ingreso", "egreso"]
    monto: float
    porcentaje: float


class MonthlyTrendItem(BaseModel):
    mes: int
    year: int
    label: str
    total_ingresos: float
    total_egresos: float


class RecentTransaction(BaseModel):
    id: uuid.UUID
    tipo: Literal["ingreso", "egreso"]
    monto: float
    descripcion: str | None
    fecha: str
    categoria_nombre: str | None


class DashboardResponse(BaseModel):
    mes: int
    year: int
    kpis: KPIs
    categoria_breakdown: list[CategoriaBreakdown]
    monthly_trend: list[MonthlyTrendItem]
    recent_transactions: list[RecentTransaction]

    model_config = {"from_attributes": True}
