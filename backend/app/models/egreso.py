import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import UUID, DATE, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Egreso(Base, TimestampMixin):
    __tablename__ = "egresos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    categoria_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("categorias.id"), nullable=False)
    subcategoria_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("subcategorias.id"), nullable=True)
    monto: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    moneda: Mapped[str] = mapped_column(String(3), default="DOP", nullable=False)
    descripcion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    metodo_pago: Mapped[str] = mapped_column(String(20), default="efectivo", nullable=False)
    fecha: Mapped[date] = mapped_column(DATE, nullable=False)
    notas: Mapped[str | None] = mapped_column(String(1000), nullable=True)
