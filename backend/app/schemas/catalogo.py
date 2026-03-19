from typing import Optional
from pydantic import BaseModel


class MonedaOut(BaseModel):
    codigo: str
    nombre: str
    simbolo: str
    activa: bool


class PaisOut(BaseModel):
    codigo: str
    nombre: str
    moneda_codigo: str
    activo: bool
    monedas: Optional[MonedaOut] = None


class BancoOut(BaseModel):
    id: str
    nombre: str
    pais_codigo: str
    activo: bool
