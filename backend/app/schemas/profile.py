from typing import Optional

from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    salario_mensual_neto: Optional[float] = Field(None, gt=0)
    mostrar_horas_trabajo: Optional[bool] = None
    onboarding_completed: Optional[bool] = None


class ProfileResponse(BaseModel):
    user_id: str
    salario_mensual_neto: Optional[float]
    mostrar_horas_trabajo: bool
    horas_por_peso: Optional[float]
    onboarding_completed: bool = False

    model_config = {"from_attributes": True}
