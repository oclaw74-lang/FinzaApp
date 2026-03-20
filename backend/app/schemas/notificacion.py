from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class NotificacionResponse(BaseModel):
    id: str
    tipo: str
    categoria: str
    titulo: str
    mensaje: str
    leida: bool
    created_at: datetime


class GenerarNotificacionesResponse(BaseModel):
    generadas: int
    mensaje: str


# --- Fix #20: Check endpoint response ---
class CheckNotificacionesResponse(BaseModel):
    generadas: int
    mensaje: str


# --- Fix #21: Web Push ---
class PushSubscriptionKeys(BaseModel):
    p256dh: str
    auth: str


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    keys: PushSubscriptionKeys


class PushSubscriptionResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    endpoint: str
    created_at: Optional[datetime] = None


class VapidPublicKeyResponse(BaseModel):
    public_key: str
