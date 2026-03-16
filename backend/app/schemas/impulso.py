from pydantic import BaseModel


class ImpulsoEvalResponse(BaseModel):
    evaluados: int
    marcados_impulso: int


class ImpulsoClasificarRequest(BaseModel):
    es_impulso: bool


class ImpulsoResumenResponse(BaseModel):
    cantidad_impulso: int
    total_impulso: float
    porcentaje_del_total: float
