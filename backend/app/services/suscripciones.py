from fastapi import HTTPException
from postgrest import APIError

from app.core.supabase_client import get_user_client
from app.schemas.suscripcion import SuscripcionCreate, SuscripcionUpdate
from app.services.base import _handle_api_error

FRECUENCIA_FACTOR: dict[str, float] = {
    "mensual": 1.0,
    "anual": 1 / 12,
    "semanal": 4.33,
    "trimestral": 1 / 3,
}


def _monto_mensual(monto: float, frecuencia: str) -> float:
    return round(monto * FRECUENCIA_FACTOR.get(frecuencia, 1.0), 2)


def _enrich(row: dict) -> dict:
    return {
        **row,
        "monto": float(row["monto"]),
        "monto_mensual": _monto_mensual(float(row["monto"]), row["frecuencia"]),
    }


def list_suscripciones(user_jwt: str, user_id: str) -> list[dict]:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("suscripciones")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    return [_enrich(row) for row in (r.data or [])]


def get_resumen(user_jwt: str, user_id: str) -> dict:
    suscripciones = list_suscripciones(user_jwt, user_id)
    activas = [s for s in suscripciones if s["activa"]]
    total_mensual = round(sum(s["monto_mensual"] for s in activas), 2)
    return {
        "total_mensual": total_mensual,
        "total_anual": round(total_mensual * 12, 2),
        "cantidad_activas": len(activas),
        "suscripciones": activas,
    }


def create_suscripcion(user_jwt: str, user_id: str, data: SuscripcionCreate) -> dict:
    client = get_user_client(user_jwt)
    payload = {
        "user_id": user_id,
        "nombre": data.nombre,
        "monto": str(data.monto),
        "frecuencia": data.frecuencia,
        "moneda": data.moneda,
        "categoria_id": str(data.categoria_id) if data.categoria_id else None,
        "fecha_proximo_cobro": data.fecha_proximo_cobro,
        "notas": data.notas,
    }
    try:
        r = client.table("suscripciones").insert(payload).execute()
    except APIError as e:
        _handle_api_error(e)
    return _enrich(r.data[0])


def update_suscripcion(user_jwt: str, user_id: str, suscripcion_id: str, data: SuscripcionUpdate) -> dict:
    client = get_user_client(user_jwt)
    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if "monto" in payload:
        payload["monto"] = str(payload["monto"])
    if not payload:
        raise HTTPException(status_code=422, detail="No fields to update.")
    try:
        r = (
            client.table("suscripciones")
            .update(payload)
            .eq("id", suscripcion_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    if not (r and r.data):
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada.")
    return _enrich(r.data[0])


def delete_suscripcion(user_jwt: str, user_id: str, suscripcion_id: str) -> None:
    client = get_user_client(user_jwt)
    try:
        r = (
            client.table("suscripciones")
            .delete()
            .eq("id", suscripcion_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)
    if not (r and r.data):
        raise HTTPException(status_code=404, detail="Suscripcion no encontrada.")


def detectar_suscripciones(user_jwt: str, user_id: str) -> list[dict]:
    """Find recurring patterns in last 3 months of egresos (candidates, not created)."""
    from datetime import date
    from collections import defaultdict

    client = get_user_client(user_jwt)
    today = date.today()
    meses: list[tuple[int, int]] = []
    for i in range(3):
        m = today.month - i
        y = today.year
        if m <= 0:
            m += 12
            y -= 1
        meses.append((y, m))

    try:
        r = (
            client.table("egresos")
            .select("descripcion,monto,categoria_id,fecha")
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as e:
        _handle_api_error(e)

    egresos = r.data or []
    by_desc: dict[str, list[dict]] = defaultdict(list)
    for e in egresos:
        fecha_str = e.get("fecha", "")
        try:
            fecha = date.fromisoformat(str(fecha_str))
            key = (fecha.year, fecha.month)
        except (ValueError, TypeError):
            continue
        if key in meses:
            desc = str(e.get("descripcion", "")).strip().lower()
            if desc:
                by_desc[desc].append({**e, "_key": key})

    candidatos = []
    for desc, items in by_desc.items():
        months_seen = {item["_key"] for item in items}
        if len(months_seen) >= 2:
            montos = [float(e["monto"]) for e in items]
            avg = sum(montos) / len(montos)
            if avg > 0 and all(abs(m - avg) / avg <= 0.10 for m in montos):
                candidatos.append({
                    "id": f"candidate-{desc[:20]}",
                    "nombre": items[0].get("descripcion", desc),
                    "monto": round(avg, 2),
                    "monto_mensual": round(avg, 2),
                    "frecuencia": "mensual",
                    "moneda": "DOP",
                    "activa": True,
                    "auto_detectada": True,
                    "fecha_proximo_cobro": None,
                    "notas": None,
                    "categoria_id": items[0].get("categoria_id"),
                })

    return candidatos


def confirmar_detectadas(user_jwt: str, user_id: str, candidatos: list[dict]) -> list[dict]:
    """Create suscripciones from confirmed candidates."""
    resultado = []
    for c in candidatos:
        data = SuscripcionCreate(
            nombre=c["nombre"],
            monto=c["monto"],
            frecuencia=c.get("frecuencia", "mensual"),
            moneda=c.get("moneda", "DOP"),
            categoria_id=c.get("categoria_id"),
        )
        created = create_suscripcion(user_jwt, user_id, data)
        # Mark as auto_detectada
        client = get_user_client(user_jwt)
        try:
            r = (
                client.table("suscripciones")
                .update({"auto_detectada": True})
                .eq("id", created["id"])
                .execute()
            )
            if r.data:
                resultado.append(_enrich(r.data[0]))
            else:
                resultado.append(created)
        except APIError:
            resultado.append(created)
    return resultado
