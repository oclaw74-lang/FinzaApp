from pydantic import BaseModel


class CategoriaImpacto(BaseModel):
    nombre: str
    monto: float
    porcentaje_del_total: float


class PrediccionMesResponse(BaseModel):
    saldo_proyectado: float
    saldo_si_presupuesto: float | None
    es_negativa: bool
    categoria_mayor_impacto: CategoriaImpacto | None
    sugerencia: str
    dias_restantes: int
    gasto_diario_promedio: float
