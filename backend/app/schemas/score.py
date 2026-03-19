from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    ahorro: int = Field(ge=0, le=25)
    presupuesto: int = Field(ge=0, le=25)
    deuda: int = Field(ge=0, le=25)
    emergencia: int = Field(ge=0, le=25)


class ScoreResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    estado: str  # "critico" | "en_riesgo" | "bueno" | "excelente"
    breakdown: ScoreBreakdown
