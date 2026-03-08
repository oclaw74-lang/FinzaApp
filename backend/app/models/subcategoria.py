import uuid

from sqlalchemy import UUID, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Subcategoria(Base, TimestampMixin):
    __tablename__ = "subcategorias"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    categoria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)

    categoria: Mapped["Categoria"] = relationship("Categoria", back_populates=None)
