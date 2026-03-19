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