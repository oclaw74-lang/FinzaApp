from datetime import date

from fastapi import HTTPException

from app.core.supabase_client import get_user_client
from app.services.base import _handle_api_error


def get_catalogo(user_jwt: str) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        r = client.table("retos").select("id, titulo, titulo_en, descripcion, descripcion_en, tipo, ahorro_estimado, icono").order("tipo").execute()
        return r.data or []
    except Exception as e:
        _handle_api_error(e)


def get_mis_retos(user_jwt: str, user_id: str) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("user_retos")
            .select("*, retos(titulo, titulo_en, descripcion, descripcion_en, tipo, ahorro_estimado, icono)")
            .eq("user_id", user_id)
            .eq("estado", "activo")
            .execute()
        )
        today = date.today().isoformat()
        result = []
        for ur in r.data or []:
            reto = ur.get("retos") or {}
            result.append(
                {
                    "id": ur["id"],
                    "reto_id": ur["reto_id"],
                    "titulo": reto.get("titulo", ""),
                    "titulo_en": reto.get("titulo_en"),
                    "descripcion": reto.get("descripcion", ""),
                    "descripcion_en": reto.get("descripcion_en"),
                    "tipo": reto.get("tipo", ""),
                    "ahorro_estimado": float(reto.get("ahorro_estimado") or 0),
                    "icono": reto.get("icono"),
                    "estado": ur["estado"],
                    "racha_dias": ur["racha_dias"],
                    "ultimo_checkin": ur.get("ultimo_checkin"),
                    "iniciado_en": ur["iniciado_en"],
                    "puede_checkin_hoy": ur.get("ultimo_checkin") != today,
                }
            )
        return result
    except Exception as e:
        _handle_api_error(e)


def aceptar_reto(user_jwt: str, user_id: str, reto_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        r = client.table("user_retos").insert({"user_id": user_id, "reto_id": reto_id}).execute()
        return r.data[0]
    except Exception as e:
        _handle_api_error(e)


def checkin_reto(user_jwt: str, user_id: str, user_reto_id: str) -> dict:
    client = get_user_client(user_jwt)
    try:
        today = date.today().isoformat()
        existing = (
            client.table("user_retos")
            .select("*")
            .eq("id", user_reto_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )
        ur = existing.data
        if ur.get("ultimo_checkin") == today:
            raise HTTPException(status_code=400, detail="Ya hiciste check-in hoy")
        new_racha = ur["racha_dias"] + 1
        client.table("user_retos").update(
            {"racha_dias": new_racha, "ultimo_checkin": today}
        ).eq("id", user_reto_id).execute()
        return {"racha_dias": new_racha, "message": f"Racha de {new_racha} dias!"}
    except HTTPException:
        raise
    except Exception as e:
        _handle_api_error(e)


def abandonar_reto(user_jwt: str, user_id: str, user_reto_id: str) -> None:
    client = get_user_client(user_jwt)
    try:
        client.table("user_retos").update({"estado": "abandonado"}).eq(
            "id", user_reto_id
        ).eq("user_id", user_id).execute()
    except Exception as e:
        _handle_api_error(e)
