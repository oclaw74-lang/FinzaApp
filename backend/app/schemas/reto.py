from pydantic import BaseModel
from typing import Optional


class RetoBase(BaseModel):
    id: str
    titulo: str
    descripcion: str
    tipo: str
    ahorro_estimado: Optional[float] = None
    icono: Optional[str] = None


class UserRetoResponse(BaseModel):
    id: str
    reto_id: str
    titulo: str
    descripcion: str
    tipo: str
    ahorro_estimado: Optional[float] = None
    icono: Optional[str] = None
    estado: str
    racha_dias: int
    ultimo_checkin: Optional[str] = None
    iniciado_en: str
    puede_checkin_hoy: bool  # computed: ultimo_checkin != today

    model_config = {"from_attributes": True}


class CheckinResponse(BaseModel):
    racha_dias: int
    message: str
