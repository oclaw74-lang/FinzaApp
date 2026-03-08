import uuid

from sqlalchemy import UUID, Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class UserConfig(Base, TimestampMixin):
    __tablename__ = "user_config"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, unique=True)
    moneda_principal: Mapped[str] = mapped_column(String(3), default="DOP", nullable=False)
    zona_horaria: Mapped[str] = mapped_column(String(50), default="America/Santo_Domingo", nullable=False)
    notificaciones_activas: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    dia_inicio_semana: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
