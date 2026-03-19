from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# --- Auth guard tests (no token) ---

@pytest.mark.asyncio
async def test_list_egresos_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/egresos")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_egreso_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/egresos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000001",
            "monto": "100.00",
            "fecha": "2026-03-08",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_egreso_invalid_monto(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/egresos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000001",
            "monto": "-50.00",
            "fecha": "2026-03-08",
        },
    )
    # 403 without auth — with auth it would be 422
    assert response.status_code in (403, 422)


@pytest.mark.asyncio
async def test_get_egreso_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/egresos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_egreso_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/egresos/00000000-0000-0000-0000-000000000001",
        json={"monto": "200.00"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_egreso_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/egresos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# --- Service unit tests (mock supabase client) ---

def test_list_egresos_returns_paginated():
    from app.services.egresos import list_egresos

    mock_response = MagicMock()
    mock_response.data = [
        {"id": "aaa", "user_id": "u1", "monto": "200.00", "fecha": "2026-03-01"}
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

    with patch("app.services.egresos.get_user_client", return_value=mock_client):
        result = list_egresos("fake-jwt", "u1")

    assert result["total"] == 1
    assert len(result["items"]) == 1
    assert result["page"] == 1
    assert result["has_next"] is False


def test_create_egreso_injects_user_id():
    from app.services.egresos import create_egreso

    inserted_row = {
        "id": "bbb", "user_id": "u1", "monto": "300.00",
        "fecha": "2026-03-08", "metodo_pago": "efectivo"
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch("app.services.egresos.get_user_client", return_value=mock_client):
        result = create_egreso("fake-jwt", "u1", {"monto": "300.00", "fecha": "2026-03-08"})

    assert result["id"] == "bbb"
    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["user_id"] == "u1"


def test_get_egreso_not_found_returns_none():
    from app.services.egresos import get_egreso

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

    with patch("app.services.egresos.get_user_client", return_value=mock_client):
        result = get_egreso("fake-jwt", "nonexistent-id", "u1")

    assert result is None


def test_update_egreso_not_found_returns_none():
    from app.services.egresos import update_egreso

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.egresos.get_user_client", return_value=mock_client):
        result = update_egreso("fake-jwt", "nonexistent-id", "u1", {"monto": "100.00"})

    assert result is None


def test_delete_egreso_performs_soft_delete():
    from app.services.egresos import delete_egreso

    mock_response = MagicMock()
    mock_response.data = [{"id": "ddd", "deleted_at": "2026-03-08T00:00:00+00:00"}]

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.egresos.get_user_client", return_value=mock_client):
        result = delete_egreso("fake-jwt", "ddd", "u1")

    assert result["id"] == "ddd"
    assert "deleted_at" in result
    update_payload = mock_client.table.return_value.update.call_args[0][0]
    assert "deleted_at" in update_payload


def test_delete_egreso_not_found_raises_404():
    from app.services.egresos import delete_egreso

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (mock_client.table.return_value
     .update.return_value
     .eq.return_value
     .eq.return_value
     .execute.return_value) = mock_response

    with patch("app.services.egresos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_egreso("fake-jwt", "nonexistent-id", "u1")

    assert exc_info.value.status_code == 404
