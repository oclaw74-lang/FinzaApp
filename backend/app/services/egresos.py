from app.core.supabase_client import get_user_client


def list_egresos(
    user_jwt: str,
    user_id: str,
    fecha_desde: str | None = None,
    fecha_hasta: str | None = None,
    categoria_id: str | None = None,
    moneda: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    client = get_user_client(user_jwt)
    query = (
        client.table("egresos")
        .select("*, categorias(nombre, color, icono)", count="exact")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
    )
    if fecha_desde:
        query = query.gte("fecha", fecha_desde)
    if fecha_hasta:
        query = query.lte("fecha", fecha_hasta)
    if categoria_id:
        query = query.eq("categoria_id", categoria_id)
    if moneda:
        query = query.eq("moneda", moneda)

    offset = (page - 1) * page_size
    query = query.order("fecha", desc=True).range(offset, offset + page_size - 1)
    response = query.execute()

    total = response.count or 0
    return {
        "items": response.data,
        "total": total,
        "page": page,
        "page_size": page_size,
        "has_next": (page * page_size) < total,
    }


def get_egreso(user_jwt: str, egreso_id: str, user_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    response = (
        client.table("egresos")
        .select("*")
        .eq("id", egreso_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .maybe_single()
        .execute()
    )
    return response.data


def create_egreso(user_jwt: str, user_id: str, data: dict) -> dict:
    client = get_user_client(user_jwt)
    payload = {**data, "user_id": user_id}
    response = client.table("egresos").insert(payload).execute()
    return response.data[0]


def update_egreso(
    user_jwt: str, egreso_id: str, user_id: str, data: dict
) -> dict | None:
    client = get_user_client(user_jwt)
    response = (
        client.table("egresos")
        .update(data)
        .eq("id", egreso_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_egreso(user_jwt: str, egreso_id: str, user_id: str) -> bool:
    client = get_user_client(user_jwt)
    from datetime import datetime, timezone

    client.table("egresos").update(
        {"deleted_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", egreso_id).eq("user_id", user_id).execute()
    return True
