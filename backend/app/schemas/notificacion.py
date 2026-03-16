from datetime import datetime
from pydantic import BaseModel


class NotificacionResponse(BaseModel):
    id: str
    tipo: str
    categoria: str
    titulo: str
    mensaje: str
    leida: bool
    created_at: datetime


class GenerarNotificacionesResponse(BaseModel):
    generadas: int
    mensaje: str
