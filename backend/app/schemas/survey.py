from typing import Optional

from pydantic import BaseModel, Field


class SurveySubmission(BaseModel):
    usaria_app: int = Field(..., ge=1, le=5, description="1-5 rating: Would you use this app?")
    precio_mensual: Optional[str] = Field(None, description="How much would you pay monthly?")
    que_mejorar: Optional[str] = Field(None, description="What would you improve?")
    que_agregar: Optional[str] = Field(None, description="What would you add?")
    experiencia_general: Optional[int] = Field(None, ge=1, le=5, description="1-5 overall experience")
    comentario: Optional[str] = Field(None, description="Additional comments")
    email_contacto: Optional[str] = Field(None, description="Contact email (optional)")


class SurveyResponse(BaseModel):
    id: str
    message: str
