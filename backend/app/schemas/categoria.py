import uuid

from pydantic import BaseModel


class CategoriaCreate(BaseModel):
    nombre: str
    tipo: str  # ingreso | egreso | ambos
    icono: str | None = None
    color: str | None = None


class CategoriaUpdate(BaseModel):
    nombre: str | None = None
    icono: str | None = None
    color: str | None = None


class CategoriaResponse(BaseModel):
    id: uuid.UUID
    nombre: str
    tipo: str
    icono: str | None
    color: str | None
    es_sistema: bool

    model_config = {"from_attributes": True}
