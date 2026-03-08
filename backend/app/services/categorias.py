from app.core.supabase_client import get_user_client


def list_categorias(user_jwt: str, tipo: str | None = None) -> list[dict]:
    client = get_user_client(user_jwt)
    query = client.table("categorias").select("*").order("nombre")
    if tipo:
        query = query.eq("tipo", tipo)
    response = query.execute()
    return response.data


def get_categoria(user_jwt: str, categoria_id: str) -> dict | None:
    client = get_user_client(user_jwt)
    response = (
        client.table("categorias")
        .select("*")
        .eq("id", categoria_id)
        .maybe_single()
        .execute()
    )
    return response.data


def create_categoria(user_jwt: str, user_id: str, data: dict) -> dict:
    client = get_user_client(user_jwt)
    payload = {**data, "user_id": user_id}
    response = client.table("categorias").insert(payload).execute()
    return response.data[0]


def update_categoria(user_jwt: str, categoria_id: str, data: dict) -> dict | None:
    client = get_user_client(user_jwt)
    response = (
        client.table("categorias").update(data).eq("id", categoria_id).execute()
    )
    return response.data[0] if response.data else None


def delete_categoria(user_jwt: str, categoria_id: str) -> bool:
    client = get_user_client(user_jwt)
    client.table("categorias").delete().eq("id", categoria_id).execute()
    return True
