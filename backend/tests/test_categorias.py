from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


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
     .order.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = list_categorias("fake-jwt")

    assert len(result) == 1
    assert result[0]["nombre"] == "Salario"


def test_list_categorias_with_tipo_filter():
    from app.services.categorias import list_categorias

    mock_response = MagicMock()
    mock_response.data = []

    mock_chain = MagicMock()
    mock_chain.execute.return_value = mock_response

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .order.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = list_categorias("fake-jwt", tipo="egreso")

    assert result == []


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


def test_get_categoria_not_found_returns_none():
    from app.services.categorias import get_categoria

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .maybe_single.return_value
     .execute.return_value) = mock_response

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = get_categoria("fake-jwt", "nonexistent-id")

    assert result is None


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


def test_delete_categoria_returns_true():
    from app.services.categorias import delete_categoria

    mock_client = MagicMock()

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = delete_categoria("fake-jwt", "some-id")

    assert result is True
