from app.core.supabase_client import get_user_client


def list_ingresos(
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
        client.table("ingresos")
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


def get_ingreso(user_jwt: str, ingreso_id: str, user_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    response = (
        client.table("ingresos")
        .select("*")
        .eq("id", ingreso_id)
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
        .maybe_single()
        .execute()
    )
    return response.data


def create_ingreso(user_jwt: str, user_id: str, data: dict) -> dict:
    client = get_user_client(user_jwt)
    payload = {**data, "user_id": user_id}
    response = client.table("ingresos").insert(payload).execute()
    return response.data[0]


def update_ingreso(
    user_jwt: str, ingreso_id: str, user_id: str, data: dict
) -> dict | None:
    client = get_user_client(user_jwt)
    response = (
        client.table("ingresos")
        .update(data)
        .eq("id", ingreso_id)
        .eq("user_id", user_id)
        .execute()
    )
    return response.data[0] if response.data else None


def delete_ingreso(user_jwt: str, ingreso_id: str, user_id: str) -> bool:
    client = get_user_client(user_jwt)
    from datetime import datetime, timezone

    client.table("ingresos").update(
        {"deleted_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", ingreso_id).eq("user_id", user_id).execute()
    return True
