from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, Field

FrecuenciaPago = Literal["quincenal", "bisemanal", "mensual"]


class ProfileUpdate(BaseModel):
    salario_mensual_neto: Optional[float] = Field(None, gt=0)
    mostrar_horas_trabajo: Optional[bool] = None
    onboarding_completed: Optional[bool] = None
    salario_bruto: Optional[Decimal] = Field(None, ge=0)
    salario_neto: Optional[Decimal] = Field(None, ge=0)
    descuentos_adicionales: Optional[Decimal] = Field(None, ge=0)
    frecuencia_pago: Optional[FrecuenciaPago] = None
    porcentaje_ahorro_metas: Optional[Decimal] = Field(None, ge=0, le=100)
    porcentaje_ahorro_fondo: Optional[Decimal] = Field(None, ge=0, le=100)
    asignacion_automatica_activa: Optional[bool] = None


class ProfileResponse(BaseModel):
    user_id: str
    salario_mensual_neto: Optional[float]
    mostrar_horas_trabajo: bool
    horas_por_peso: Optional[float]
    onboarding_completed: bool = False
    salario_bruto: Optional[float] = None
    salario_neto: Optional[float] = None
    descuentos_adicionales: Optional[float] = None
    frecuencia_pago: Optional[str] = None
    porcentaje_ahorro_metas: Optional[float] = None
    porcentaje_ahorro_fondo: Optional[float] = None
    asignacion_automatica_activa: bool = False

    model_config = {"from_attributes": True}
