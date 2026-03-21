from pydantic import BaseModel
from datetime import date
from typing import Optional
import uuid


class EstadoCuentaCreate(BaseModel):
    tarjeta_id: Optional[uuid.UUID] = None
    fecha_estado: Optional[date] = None
    monto_total: Optional[float] = None


class EstadoCuentaResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    tarjeta_id: Optional[uuid.UUID] = None
    nombre_archivo: str
    url_archivo: str
    fecha_estado: Optional[date] = None
    monto_total: Optional[float] = None
    created_at: str

    model_config = {"from_attributes": True}
