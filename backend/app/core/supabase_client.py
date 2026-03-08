from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    """Service role — bypasses RLS. Only for admin/seed operations."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


def get_user_client(user_jwt: str) -> Client:
    """User JWT — RLS enforced automatically."""
    client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    client.postgrest.auth(user_jwt)
    return client
