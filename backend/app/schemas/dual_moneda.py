from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DualMonedaConfig(BaseModel):
    moneda_principal: str
    moneda_secundaria: Optional[str] = None
    tasa_cambio: Optional[float] = None
    tasa_cambio_actualizada_at: Optional[datetime] = None


class DualMonedaUpdate(BaseModel):
    moneda_secundaria: Optional[str] = None
    tasa_cambio: Optional[float] = None
