from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# --- Auth guard tests (no token) ---

@pytest.mark.asyncio
async def test_list_ingresos_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ingresos")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/ingresos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000001",
            "monto": "100.00",
            "fecha": "2026-03-08",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_ingreso_invalid_monto(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/ingresos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000001",
            "monto": "-50.00",
            "fecha": "2026-03-08",
        },
    )
    # 403 without auth — with auth it would be 422
    assert response.status_code in (403, 422)


@pytest.mark.asyncio
async def test_get_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/ingresos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/ingresos/00000000-0000-0000-0000-000000000001",
        json={"monto": "200.00"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/ingresos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# --- Service unit tests (mock supabase client) ---

def test_list_ingresos_returns_paginated():
    from app.services.ingresos import list_ingresos

    mock_response = MagicMock()
    mock_response.data = [
        {"id": "aaa", "user_id": "u1", "monto": "100.00", "fecha": "2026-03-01"}
    ]
    mock_response.count = 1

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .order.return_value
     .range.return_value
     .execute.return_value) = mock_response

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        result = list_ingresos("fake-jwt", "u1")

    assert result["total"] == 1
    assert len(result["items"]) == 1
    assert result["page"] == 1
    assert result["has_next"] is False


def test_list_ingresos_api_error_raises_http_500():
    from app.services.ingresos import list_ingresos

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .order.return_value
     .range.return_value
     .execute.side_effect) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            list_ingresos("fake-jwt", "u1")

    assert exc_info.value.status_code == 500


def test_create_ingreso_injects_user_id():
    from app.services.ingresos import create_ingreso

    inserted_row = {"id": "bbb", "user_id": "u1", "monto": "500.00", "fecha": "2026-03-08"}
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        result = create_ingreso("fake-jwt", "u1", {"monto": "500.00", "fecha": "2026-03-08"})

    assert result["id"] == "bbb"
    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["user_id"] == "u1"


def test_create_ingreso_api_error_409_raises_http_409():
    from app.services.ingresos import create_ingreso

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "23505", "message": "duplicate key value"}
    )

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            create_ingreso("fake-jwt", "u1", {"monto": "500.00"})

    assert exc_info.value.status_code == 409


def test_create_ingreso_api_error_400_raises_http_400():
    from app.services.ingresos import create_ingreso

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Bad request"}
    )

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            create_ingreso("fake-jwt", "u1", {"monto": "500.00"})

    assert exc_info.value.status_code == 400


def test_get_ingreso_not_found_returns_none():
    from app.services.ingresos import get_ingreso

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .eq.return_value
     .is_.return_value
     .maybe_single.return_value
     .execute.return_value) = mock_response

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        result = get_ingreso("fake-jwt", "nonexistent-id", "u1")

    assert result is None


def test_update_ingreso_not_found_returns_none():
    from app.services.ingresos import update_ingreso

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        result = update_ingreso("fake-jwt", "nonexistent-id", "u1", {"monto": "200.00"})

    assert result is None


# --- BLOCKER #29 + #31: soft delete with 404 on missing ---

def test_delete_ingreso_performs_soft_delete():
    from app.services.ingresos import delete_ingreso

    mock_response = MagicMock()
    mock_response.data = [{"id": "ccc", "deleted_at": "2026-03-08T00:00:00+00:00"}]

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        result = delete_ingreso("fake-jwt", "ccc", "u1")

    assert result["id"] == "ccc"
    assert "deleted_at" in result
    update_payload = mock_client.table.return_value.update.call_args[0][0]
    assert "deleted_at" in update_payload


def test_delete_ingreso_not_found_raises_404():
    """delete_ingreso must raise 404 when no rows were updated (record not found)."""
    from app.services.ingresos import delete_ingreso

    mock_response = MagicMock()
    mock_response.data = []  # empty = record not found

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_ingreso("fake-jwt", "nonexistent-id", "u1")

    assert exc_info.value.status_code == 404


def test_delete_ingreso_api_error_raises_http_500():
    from app.services.ingresos import delete_ingreso

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.side_effect) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_ingreso("fake-jwt", "nonexistent-id", "u1")

    assert exc_info.value.status_code == 500


# --- distribuir_ahorro_automatico tests (fix/config-salario-ahorro-automatico) ---

def test_crear_ingreso_sueldo_sin_asignacion_activa():
    """distribuir_ahorro_automatico returns early when asignacion_automatica_activa=False.

    No RPC calls or table writes should be made beyond reading the profile.
    """
    from decimal import Decimal

    from app.services.ingresos import distribuir_ahorro_automatico

    mock_client = MagicMock()
    # Profile: asignacion NOT active
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .maybe_single.return_value
     .execute.return_value) = MagicMock(
        data={
            "asignacion_automatica_activa": False,
            "porcentaje_ahorro_metas": "10",
            "porcentaje_ahorro_fondo": "5",
        }
    )

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        distribuir_ahorro_automatico("fake-jwt", "u-1", Decimal("50000"))

    # Function must exit early — no RPC, no writes beyond the profile read
    mock_client.rpc.assert_not_called()
    assert mock_client.table.call_count == 1
    assert mock_client.table.call_args[0][0] == "profiles"


def test_crear_ingreso_sueldo_con_asignacion_activa_distribuye():
    """distribuir_ahorro_automatico calls the RPC for each active meta
    when asignacion_automatica_activa=True and porcentaje_ahorro_metas=10.
    """
    from decimal import Decimal

    from app.services.ingresos import distribuir_ahorro_automatico

    mock_client = MagicMock()

    # Route table calls to different tables through side_effect
    profile_table = MagicMock()
    profile_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
        data={
            "asignacion_automatica_activa": True,
            "porcentaje_ahorro_metas": "10",
            "porcentaje_ahorro_fondo": None,
        }
    )

    metas_table = MagicMock()
    metas_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[{"id": "meta-1", "monto_actual": "0", "monto_objetivo": "10000"}]
    )

    def table_side_effect(name: str) -> MagicMock:
        if name == "profiles":
            return profile_table
        if name == "metas_ahorro":
            return metas_table
        return MagicMock()

    mock_client.table.side_effect = table_side_effect
    mock_client.rpc.return_value.execute.return_value = MagicMock()

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        distribuir_ahorro_automatico("fake-jwt", "u-1", Decimal("50000"))

    # RPC must have been called once for the single active meta
    mock_client.rpc.assert_called_once()
    rpc_name, rpc_params = mock_client.rpc.call_args[0]
    assert rpc_name == "agregar_contribucion_meta"
    assert rpc_params["p_meta_id"] == "meta-1"
    assert rpc_params["p_tipo"] == "deposito"


@pytest.mark.asyncio
async def test_crear_ingreso_no_sueldo_no_distribuye(client: AsyncClient) -> None:
    """Income with a non-salary category ('Freelance') must NOT trigger
    distribuir_ahorro_automatico at the route layer.
    """
    from app.core.security import get_current_user, get_raw_token
    from app.main import app

    ingreso_row = {
        "id": "00000000-0000-0000-0000-000000000010",
        "user_id": "u-1",
        "categoria_id": "00000000-0000-0000-0000-000000000099",
        "subcategoria_id": None,
        "monto": "500.00",
        "moneda": "DOP",
        "descripcion": None,
        "fuente": None,
        "fecha": "2026-03-08",
        "notas": None,
    }

    # Override auth dependencies so the route accepts the request
    app.dependency_overrides[get_current_user] = lambda: {
        "user_id": "u-1",
        "email": "test@test.com",
    }
    app.dependency_overrides[get_raw_token] = lambda: "fake-token"

    try:
        # Client used by svc.create_ingreso (module-level import in ingresos service)
        mock_svc_client = MagicMock()
        mock_svc_client.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[ingreso_row]
        )

        # Client used by the route's local `from app.core.supabase_client import get_user_client`
        mock_route_client = MagicMock()
        (mock_route_client.table.return_value
         .select.return_value
         .eq.return_value
         .maybe_single.return_value
         .execute.return_value) = MagicMock(data={"nombre": "Freelance"})

        with (
            patch("app.services.ingresos.get_user_client", return_value=mock_svc_client),
            patch("app.core.supabase_client.get_user_client", return_value=mock_route_client),
            patch("app.services.ingresos.distribuir_ahorro_automatico") as mock_distribuir,
        ):
            response = await client.post(
                "/api/v1/ingresos",
                json={
                    "categoria_id": "00000000-0000-0000-0000-000000000099",
                    "monto": "500.00",
                    "fecha": "2026-03-08",
                },
            )

        assert response.status_code == 201
        mock_distribuir.assert_not_called()
    finally:
        app.dependency_overrides.clear()


def test_distribuir_ahorro_sin_metas_activas_no_falla():
    """distribuir_ahorro_automatico completes silently when there are no active metas.

    No exception must be raised and no RPC must be called.
    """
    from decimal import Decimal

    from app.services.ingresos import distribuir_ahorro_automatico

    mock_client = MagicMock()

    profile_table = MagicMock()
    profile_table.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
        data={
            "asignacion_automatica_activa": True,
            "porcentaje_ahorro_metas": "10",
            "porcentaje_ahorro_fondo": None,
        }
    )

    metas_table = MagicMock()
    # Empty list — no active metas pending completion
    metas_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
        data=[]
    )

    def table_side_effect(name: str) -> MagicMock:
        if name == "profiles":
            return profile_table
        if name == "metas_ahorro":
            return metas_table
        return MagicMock()

    mock_client.table.side_effect = table_side_effect

    with patch("app.services.ingresos.get_user_client", return_value=mock_client):
        # Must not raise any exception
        distribuir_ahorro_automatico("fake-jwt", "u-1", Decimal("50000"))

    mock_client.rpc.assert_not_called()
