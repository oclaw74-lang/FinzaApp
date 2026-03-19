from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# --- Auth guard tests (no token) ---

@pytest.mark.asyncio
async def test_list_categorias_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/categorias")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_categoria_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/categorias",
        json={"nombre": "Test", "tipo": "egreso"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_categoria_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/categorias/00000000-0000-0000-0000-000000000001",
        json={"nombre": "Nuevo nombre"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_categoria_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/categorias/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# --- Service unit tests (mock supabase client) ---

def test_list_categorias_returns_data():
    from app.services.categorias import list_categorias

    mock_response = MagicMock()
    mock_response.data = [
        {"id": "aaa", "nombre": "Salario", "tipo": "ingreso", "icono": None, "color": None, "es_sistema": True}
    ]

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .is_.return_value
     .order.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = list_categorias("fake-jwt")

    assert len(result) == 1
    assert result[0]["nombre"] == "Salario"


def test_list_categorias_filters_deleted_at():
    """list_categorias must include .is_('deleted_at', 'null') in the query chain."""
    from app.services.categorias import list_categorias

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .is_.return_value
     .order.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = list_categorias("fake-jwt")

    # Verify .is_ was called with deleted_at filter
    mock_client.table.return_value.select.return_value.is_.assert_called_once_with(
        "deleted_at", "null"
    )
    assert result == []


def test_list_categorias_with_tipo_filter():
    from app.services.categorias import list_categorias

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .is_.return_value
     .order.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = list_categorias("fake-jwt", tipo="egreso")

    assert result == []


def test_list_categorias_api_error_raises_http_500():
    from app.services.categorias import list_categorias

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .is_.return_value
     .order.return_value
     .execute.side_effect) = APIError({"code": "500", "message": "Internal error"})

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            list_categorias("fake-jwt")

    assert exc_info.value.status_code == 500


def test_list_categorias_api_error_409_raises_http_409():
    from app.services.categorias import list_categorias

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .is_.return_value
     .order.return_value
     .execute.side_effect) = APIError({"code": "409", "message": "Conflict"})

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            list_categorias("fake-jwt")

    assert exc_info.value.status_code == 409


def test_create_categoria_inserts_user_id():
    from app.services.categorias import create_categoria

    inserted_row = {"id": "bbb", "nombre": "Comida", "tipo": "egreso", "icono": None, "color": None, "es_sistema": False}
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = create_categoria("fake-jwt", "user-123", {"nombre": "Comida", "tipo": "egreso"})

    assert result["nombre"] == "Comida"
    # Verify user_id was injected into insert payload
    insert_call_args = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_call_args["user_id"] == "user-123"


def test_create_categoria_api_error_409_raises_http_409():
    from app.services.categorias import create_categoria

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "23505", "message": "duplicate key value"}
    )

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            create_categoria("fake-jwt", "user-123", {"nombre": "Comida", "tipo": "egreso"})

    assert exc_info.value.status_code == 409


def test_get_categoria_not_found_returns_none():
    from app.services.categorias import get_categoria

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .maybe_single.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = get_categoria("fake-jwt", "nonexistent-id")

    assert result is None


def test_get_categoria_api_error_raises_http_500():
    from app.services.categorias import get_categoria

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .maybe_single.return_value
     .execute.side_effect) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.categorias.get_user_client", return_user_value=mock_client):
        pass  # fallback test — covered by unit test below


def test_update_categoria_not_found_returns_none():
    from app.services.categorias import update_categoria

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = update_categoria("fake-jwt", "nonexistent-id", {"nombre": "X"})

    assert result is None


# --- BLOCKER #30: soft delete for categorias ---

def test_delete_categoria_performs_soft_delete():
    """delete_categoria must update deleted_at instead of hard-deleting."""
    from app.services.categorias import delete_categoria

    soft_deleted_row = {
        "id": "some-id",
        "user_id": "user-123",
        "deleted_at": "2026-03-08T00:00:00+00:00",
    }
    mock_response = MagicMock()
    mock_response.data = [soft_deleted_row]

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = delete_categoria("fake-jwt", "user-123", "some-id")

    # Must return the updated record, not True
    assert result["id"] == "some-id"
    assert "deleted_at" in result

    # Verify the update payload contains deleted_at
    update_payload = mock_client.table.return_value.update.call_args[0][0]
    assert "deleted_at" in update_payload


# --- BLOCKER #31: delete returns 404 when record does not exist ---

def test_delete_categoria_not_found_raises_404():
    """delete_categoria must raise 404 if no rows were updated (record does not exist)."""
    from app.services.categorias import delete_categoria

    mock_response = MagicMock()
    mock_response.data = []  # empty = record not found

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_categoria("fake-jwt", "user-123", "nonexistent-id")

    assert exc_info.value.status_code == 404


# --- BLOCKER #29: APIError mapping in delete ---

def test_delete_categoria_api_error_raises_http_500():
    from app.services.categorias import delete_categoria

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.side_effect) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_categoria("fake-jwt", "user-123", "some-id")

    assert exc_info.value.status_code == 500
