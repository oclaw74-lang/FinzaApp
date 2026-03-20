from pydantic import BaseModel
from typing import Optional, Any


class CategoriaImpacto(BaseModel):
    nombre: str
    nombre_en: Optional[str] = None
    monto: float
    porcentaje_del_total: float


class PrediccionMesResponse(BaseModel):
    saldo_proyectado: float
    saldo_si_presupuesto: Optional[float]
    es_negativa: bool
    categoria_mayor_impacto: Optional[CategoriaImpacto]
    sugerencia_tipo: str  # 'reducir' | 'positivo' | 'negativo'
    sugerencia_datos: Optional[dict[str, Any]] = None
    dias_restantes: int
    gasto_diario_promedio: float
    # --- Campos enriquecidos (Fix #19) ---
    ingreso_esperado: float = 0.0
    gasto_esperado: float = 0.0
    balance_final: float = 0.0
    avg_egresos_3m: float = 0.0
    sum_cuotas_prestamos: float = 0.0
    sum_suscripciones: float = 0.0
    sum_compromisos_ahorro: float = 0.0
    egresos_proyectados: float = 0.0