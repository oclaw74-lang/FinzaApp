import uuid

from pydantic import BaseModel


class UserConfigUpdate(BaseModel):
    moneda_principal: str | None = None
    zona_horaria: str | None = None
    notificaciones_activas: bool | None = None
    dia_inicio_semana: int | None = None


class UserConfigResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    moneda_principal: str
    zona_horaria: str
    notificaciones_activas: bool
    dia_inicio_semana: int

    model_config = {"from_attributes": True}
