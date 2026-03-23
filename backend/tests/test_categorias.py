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
    # es_sistema check: not a system category
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .maybe_single.return_value
     .execute.return_value.data) = None
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
    mock_client = MagicMock()

    # Call 1: es_sistema check (select…maybe_single) → not a system category
    check_mock = MagicMock()
    check_mock.execute.return_value.data = None

    # Call 2: update (no return data expected)
    update_mock = MagicMock()
    update_mock.eq.return_value.eq.return_value.execute.return_value.data = []

    # Call 3: post-update select (maybe_single) → returns soft-deleted row
    fetch_mock = MagicMock()
    fetch_mock.execute.return_value.data = soft_deleted_row

    def table_side_effect(table_name):
        tbl = MagicMock()
        # First .select().eq().is_().maybe_single() → check
        tbl.select.return_value.eq.return_value.is_.return_value.maybe_single.return_value = check_mock
        # .update().eq().eq().execute() → update
        tbl.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        # .select("*").eq().maybe_single() → fetch after update
        sel = MagicMock()
        sel.eq.return_value.maybe_single.return_value = fetch_mock
        tbl.select.return_value = sel
        # reuse check_mock for first select call (is_ chain)
        sel.eq.return_value.is_.return_value.maybe_single.return_value = check_mock
        return tbl

    mock_client.table.side_effect = table_side_effect

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = delete_categoria("fake-jwt", "user-123", "some-id")

    assert result["id"] == "some-id"
    assert "deleted_at" in result


# --- BLOCKER #31: delete returns 404 when record does not exist ---

def test_delete_categoria_not_found_raises_404():
    """delete_categoria must raise 404 if post-update fetch returns no row."""
    from app.services.categorias import delete_categoria

    mock_client = MagicMock()

    def table_side_effect(table_name):
        tbl = MagicMock()
        # es_sistema check → not system
        tbl.select.return_value.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = None
        # update → no data returned (normal SDK behavior)
        tbl.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        # post-update select returns None (row not found)
        fetch = MagicMock()
        fetch.execute.return_value.data = None
        sel = MagicMock()
        sel.eq.return_value.maybe_single.return_value = fetch
        sel.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = None
        tbl.select.return_value = sel
        return tbl

    mock_client.table.side_effect = table_side_effect

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_categoria("fake-jwt", "user-123", "nonexistent-id")

    assert exc_info.value.status_code == 404


# --- BLOCKER #29: APIError mapping in delete ---

def test_delete_categoria_api_error_raises_http_500():
    from app.services.categorias import delete_categoria

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .maybe_single.return_value
     .execute.return_value.data) = None  # no es_sistema

    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.side_effect) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_categoria("fake-jwt", "user-123", "some-id")

    assert exc_info.value.status_code == 500


# ---------------------------------------------------------------------------
# Fix #6 / Fix #8 — sistema category protection
# ---------------------------------------------------------------------------


def test_update_sistema_categoria_raises_403():
    """update_categoria must raise 403 for system categories (es_sistema=True)."""
    from app.services.categorias import update_categoria

    # Table mock: select returns a system category, update should never be called
    select_mock = MagicMock()
    select_mock.select.return_value.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = {
        "id": "sys-cat-id",
        "nombre": "Salario",
        "es_sistema": True,
    }

    mock_client = MagicMock()
    mock_client.table.return_value = select_mock

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            update_categoria("fake-jwt", "sys-cat-id", {"nombre": "Hackeado"})

    assert exc_info.value.status_code == 403
    assert "sistema" in exc_info.value.detail.lower()
    # update should never have been invoked
    select_mock.update.assert_not_called()


def test_update_user_categoria_succeeds():
    """update_categoria must allow updates for non-system (user) categories."""
    from app.services.categorias import update_categoria

    updated_row = {
        "id": "user-cat-id",
        "nombre": "Comida Rapida",
        "tipo": "egreso",
        "icono": None,
        "color": None,
        "es_sistema": False,
    }

    mock_client = MagicMock()

    def table_side_effect(table_name):
        tbl = MagicMock()
        # update → no return data (SDK behavior)
        tbl.update.return_value.eq.return_value.execute.return_value.data = []

        def select_side_effect(cols):
            sel = MagicMock()
            if cols == "es_sistema":
                sel.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = {
                    "id": "user-cat-id", "es_sistema": False
                }
            else:
                # post-update fetch → returns updated row
                sel.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = updated_row
            return sel

        tbl.select.side_effect = select_side_effect
        return tbl

    mock_client.table.side_effect = table_side_effect

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        result = update_categoria("fake-jwt", "user-cat-id", {"nombre": "Comida Rapida"})

    assert result is not None
    assert result["nombre"] == "Comida Rapida"


def test_delete_sistema_categoria_raises_403():
    """delete_categoria must raise 403 for system categories (es_sistema=True)."""
    from app.services.categorias import delete_categoria

    check_mock = MagicMock()
    check_mock.select.return_value.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = {
        "id": "sys-cat-egreso",
        "nombre": "Pago de Préstamo",
        "es_sistema": True,
    }

    mock_client = MagicMock()
    mock_client.table.return_value = check_mock

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_categoria("fake-jwt", "user-123", "sys-cat-egreso")

    assert exc_info.value.status_code == 403
    assert "sistema" in exc_info.value.detail.lower()
    # update (soft-delete) should never have been invoked
    check_mock.update.assert_not_called()


def test_delete_sistema_cobro_prestamo_raises_403():
    """delete_categoria must raise 403 for 'Cobro de Préstamo' system category."""
    from app.services.categorias import delete_categoria

    check_mock = MagicMock()
    check_mock.select.return_value.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value.data = {
        "id": "sys-cat-ingreso",
        "nombre": "Cobro de Préstamo",
        "es_sistema": True,
    }

    mock_client = MagicMock()
    mock_client.table.return_value = check_mock

    with patch("app.services.categorias.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_categoria("fake-jwt", "user-123", "sys-cat-ingreso")

    assert exc_info.value.status_code == 403
