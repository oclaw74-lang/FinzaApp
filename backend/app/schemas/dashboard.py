import uuid
from typing import Literal

from pydantic import BaseModel


class KPIs(BaseModel):
    total_ingresos: float
    total_egresos: float
    balance: float
    ahorro_estimado: float
    total_ahorrado: float


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


# ---------------------------------------------------------------------------
# Dashboard V2 schemas
# ---------------------------------------------------------------------------


class ResumenFinanciero(BaseModel):
    ingresos_mes: float
    egresos_mes: float
    balance_mes: float
    tasa_ahorro: float
    ingresos_mes_anterior: float
    egresos_mes_anterior: float
    variacion_ingresos_pct: float
    variacion_egresos_pct: float
    total_ahorrado: float


class PresupuestoEstadoDashboard(BaseModel):
    categoria: str
    monto_presupuestado: float
    gasto_actual: float
    porcentaje_usado: float
    alerta: bool


class MetaActivaDashboard(BaseModel):
    nombre: str
    monto_objetivo: float
    monto_actual: float
    porcentaje_completado: float
    fecha_limite: str | None


class PrestamosActivosDashboard(BaseModel):
    total_deuda: float
    count: int
    proximo_vencimiento: str | None


class TransaccionReciente(BaseModel):
    tipo: Literal["ingreso", "egreso"]
    descripcion: str
    monto: float
    fecha: str
    categoria: str | None


class EgresoCategoria(BaseModel):
    categoria: str
    total: float
    porcentaje: float


class DashboardV2Response(BaseModel):
    resumen_financiero: ResumenFinanciero
    presupuestos_estado: list[PresupuestoEstadoDashboard]
    metas_activas: list[MetaActivaDashboard]
    prestamos_activos: PrestamosActivosDashboard
    ultimas_transacciones: list[TransaccionReciente]
    egresos_por_categoria: list[EgresoCategoria]

    model_config = {"from_attributes": True}
