from fastapi import HTTPException
from postgrest import APIError


def _handle_api_error(e: APIError) -> None:
    """Translate a PostgREST APIError into an appropriate HTTPException.

    Handles Postgres SQLSTATE codes and HTTP-style numeric codes returned
    by Supabase PostgREST.
    """
    code = e.code or ""
    # Postgres SQLSTATE: 23505 = unique_violation, 23503 = foreign_key_violation
    if code == "23505":
        raise HTTPException(status_code=409, detail=str(e.message))
    if code == "23503":
        raise HTTPException(status_code=400, detail=str(e.message))
    # 23514 = check_violation (e.g. constraint on meta_meses)
    if code == "23514":
        raise HTTPException(status_code=400, detail=str(e.message))
    # PGRST204 = column not found in schema cache (migration not applied)
    if code == "PGRST204":
        raise HTTPException(status_code=400, detail=str(e.message))
    # 42703 = undefined_column (Postgres SQLSTATE)
    if code == "42703":
        raise HTTPException(status_code=400, detail=str(e.message))
    try:
        status = int(code)
    except (ValueError, TypeError):
        raise HTTPException(status_code=500, detail="Error interno del servidor.")
    if status == 400:
        raise HTTPException(status_code=400, detail=str(e.message))
    if status == 404:
        raise HTTPException(status_code=404, detail=str(e.message))
    if status == 409:
        raise HTTPException(status_code=409, detail=str(e.message))
    raise HTTPException(status_code=500, detail="Error interno del servidor.")
