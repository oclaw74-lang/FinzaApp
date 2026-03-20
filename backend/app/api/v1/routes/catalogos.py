from fastapi import APIRouter, HTTPException

from app.core.supabase_client import get_admin_client
from app.schemas.catalogo import BancoOut, MonedaOut, PaisOut

router = APIRouter(prefix="/catalogos", tags=["catalogos"])


@router.get("/monedas", response_model=list[MonedaOut])
def get_monedas() -> list[dict]:
    client = get_admin_client()
    res = client.table("monedas").select("*").eq("activa", True).order("nombre").execute()
    return res.data


@router.get("/paises", response_model=list[PaisOut])
def get_paises() -> list[dict]:
    client = get_admin_client()
    res = client.table("paises").select("*, monedas(*)").eq("activo", True).order("nombre").execute()
    return res.data


@router.get("/bancos", response_model=list[BancoOut])
def get_bancos() -> list[dict]:
    client = get_admin_client()
    res = (
        client.table("bancos")
        .select("*")
        .eq("activo", True)
        .order("nombre")
        .execute()
    )
    return res.data


@router.get("/paises/{codigo}/bancos", response_model=list[BancoOut])
def get_bancos_por_pais(codigo: str) -> list[dict]:
    client = get_admin_client()
    res = (
        client.table("bancos")
        .select("*")
        .eq("pais_codigo", codigo.upper())
        .eq("activo", True)
        .order("nombre")
        .execute()
    )
    return res.data
