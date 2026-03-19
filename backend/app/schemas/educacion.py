from pydantic import BaseModel
from typing import Optional, Any


class LeccionResponse(BaseModel):
    id: str
    titulo: str
    descripcion_corta: str
    contenido_json: dict[str, Any]
    nivel: str
    duracion_minutos: int
    orden: int
    completada: bool = False

    model_config = {"from_attributes": True}


class MarcarCompletadaResponse(BaseModel):
    leccion_id: str
    completada: bool
