from datetime import datetime, timezone

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def get_lecciones(user_jwt: str, user_id: str) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        lecciones = client.table("lecciones").select("*").order("nivel").order("orden").execute()
        progreso = (
            client.table("user_lecciones")
            .select("leccion_id, completada")
            .eq("user_id", user_id)
            .execute()
        )
        completadas = {
            p["leccion_id"] for p in (progreso.data or []) if p["completada"]
        }
        result = []
        for leccion in lecciones.data or []:
            result.append({**leccion, "completada": leccion["id"] in completadas})
        return result
    except Exception as e:
        _handle_api_error(e)


def marcar_completada(user_jwt: str, user_id: str, leccion_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        client.table("user_lecciones").upsert(
            {
                "user_id": user_id,
                "leccion_id": leccion_id,
                "completada": True,
                "completada_en": datetime.now(timezone.utc).isoformat(),
            },
            on_conflict="user_id,leccion_id",
        ).execute()
        return {"leccion_id": leccion_id, "completada": True}
    except Exception as e:
        _handle_api_error(e)
