"""
Tests for the estado_cuenta feature.

Service-level tests mock the Supabase clients directly.
Router-level tests use the ASGI test client and dependency overrides
for the auth-gated validation endpoints (type & size checks).
"""
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Auth guard tests — no token -> 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upload_requires_auth(client: AsyncClient) -> None:
    data = {"file": ("test.pdf", b"%PDF-1.4", "application/pdf")}
    response = await client.post("/api/v1/estados-cuenta/upload", files=data)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_estados_cuenta_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/estados-cuenta/")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_estado_cuenta_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/estados-cuenta/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Router-level validation tests (auth bypassed via dependency_overrides)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_upload_rejects_wrong_type(client: AsyncClient) -> None:
    """Non-PDF/image MIME type must return 422 when authenticated."""
    from app.main import app
    from app.core.security import get_current_user, get_raw_token

    fake_user = {"user_id": "00000000-0000-0000-0000-000000000001", "email": "t@t.com", "role": "authenticated"}
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_raw_token] = lambda: "fake-token"

    try:
        response = await client.post(
            "/api/v1/estados-cuenta/upload",
            files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
        )
        assert response.status_code == 422
        assert "no permitido" in response.json().get("detail", "").lower()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_upload_rejects_too_large(client: AsyncClient) -> None:
    """File exceeding 10 MB must return 422 when authenticated."""
    from app.main import app
    from app.core.security import get_current_user, get_raw_token

    fake_user = {"user_id": "00000000-0000-0000-0000-000000000001", "email": "t@t.com", "role": "authenticated"}
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_raw_token] = lambda: "fake-token"

    try:
        large_bytes = b"%PDF-1.4" + b"0" * (10 * 1024 * 1024 + 1)
        response = await client.post(
            "/api/v1/estados-cuenta/upload",
            files={"file": ("big.pdf", large_bytes, "application/pdf")},
        )
        assert response.status_code == 422
        assert "grande" in response.json().get("detail", "").lower()
    finally:
        app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Service unit tests — mock Supabase clients
# ---------------------------------------------------------------------------


def _make_insert_mock(row: dict) -> MagicMock:
    mock_response = MagicMock()
    mock_response.data = [row]
    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response
    return mock_client


def test_upload_estado_cuenta_success() -> None:
    from app.services.estado_cuenta import upload_estado_cuenta

    inserted_row = {
        "id": "aaa",
        "user_id": "u1",
        "tarjeta_id": None,
        "nombre_archivo": "estado.pdf",
        "url_archivo": "https://example.com/u1/uuid_estado.pdf",
        "fecha_estado": None,
        "monto_total": None,
        "created_at": "2026-06-01T00:00:00+00:00",
    }

    mock_admin = MagicMock()
    mock_admin.storage.from_.return_value.upload.return_value = MagicMock()
    mock_admin.storage.from_.return_value.get_public_url.return_value = (
        "https://example.com/u1/uuid_estado.pdf"
    )

    mock_user_client = _make_insert_mock(inserted_row)

    with (
        patch("app.services.estado_cuenta.get_admin_client", return_value=mock_admin),
        patch("app.services.estado_cuenta.get_user_client", return_value=mock_user_client),
    ):
        result = upload_estado_cuenta(
            user_jwt="fake-jwt",
            user_id="u1",
            file_bytes=b"%PDF-1.4",
            filename="estado.pdf",
            content_type="application/pdf",
        )

    assert result["id"] == "aaa"
    assert result["nombre_archivo"] == "estado.pdf"
    # Verify storage upload was called
    mock_admin.storage.from_.return_value.upload.assert_called_once()
    call_args = mock_admin.storage.from_.return_value.upload.call_args
    path_arg = call_args[0][0]
    assert path_arg.startswith("u1/")
    assert path_arg.endswith("_estado.pdf")
    # Verify DB insert payload
    insert_payload = mock_user_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["user_id"] == "u1"
    assert insert_payload["nombre_archivo"] == "estado.pdf"


def test_upload_estado_cuenta_storage_error_raises_500() -> None:
    from app.services.estado_cuenta import upload_estado_cuenta

    mock_admin = MagicMock()
    mock_admin.storage.from_.return_value.upload.side_effect = Exception("Storage error")

    with (
        patch("app.services.estado_cuenta.get_admin_client", return_value=mock_admin),
    ):
        with pytest.raises(HTTPException) as exc_info:
            upload_estado_cuenta(
                user_jwt="fake-jwt",
                user_id="u1",
                file_bytes=b"%PDF-1.4",
                filename="estado.pdf",
                content_type="application/pdf",
            )
    assert exc_info.value.status_code == 500


def test_list_estados_cuenta_empty() -> None:
    from app.services.estado_cuenta import list_estados_cuenta

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .is_.return_value
        .order.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.estado_cuenta.get_user_client", return_value=mock_client):
        result = list_estados_cuenta("fake-jwt", "u1")

    assert result == []


def test_list_estados_cuenta_returns_records() -> None:
    from app.services.estado_cuenta import list_estados_cuenta

    rows = [
        {"id": "aaa", "user_id": "u1", "nombre_archivo": "ec1.pdf", "url_archivo": "https://x.com/ec1.pdf",
         "tarjeta_id": None, "fecha_estado": None, "monto_total": None, "created_at": "2026-06-01T00:00:00+00:00"},
    ]
    mock_response = MagicMock()
    mock_response.data = rows

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .is_.return_value
        .order.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.estado_cuenta.get_user_client", return_value=mock_client):
        result = list_estados_cuenta("fake-jwt", "u1")

    assert len(result) == 1
    assert result[0]["id"] == "aaa"


def test_list_estados_cuenta_filtered_by_tarjeta() -> None:
    from app.services.estado_cuenta import list_estados_cuenta

    rows = [{"id": "bbb", "user_id": "u1", "tarjeta_id": "t1", "nombre_archivo": "ec2.pdf",
             "url_archivo": "https://x.com/ec2.pdf", "fecha_estado": None, "monto_total": None,
             "created_at": "2026-06-01T00:00:00+00:00"}]
    mock_response = MagicMock()
    mock_response.data = rows

    mock_client = MagicMock()
    # Chain for filtered query: .eq().is_().order().eq().execute()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .is_.return_value
        .order.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.estado_cuenta.get_user_client", return_value=mock_client):
        result = list_estados_cuenta("fake-jwt", "u1", tarjeta_id="t1")

    assert len(result) == 1
    assert result[0]["tarjeta_id"] == "t1"


def test_delete_estado_cuenta() -> None:
    from app.services.estado_cuenta import delete_estado_cuenta

    mock_response = MagicMock()
    mock_response.data = [{"id": "aaa", "deleted_at": "2026-06-01T00:00:00+00:00"}]

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.estado_cuenta.get_user_client", return_value=mock_client):
        # Should not raise
        delete_estado_cuenta("fake-jwt", "u1", "aaa")

    update_payload = mock_client.table.return_value.update.call_args[0][0]
    assert "deleted_at" in update_payload


def test_delete_estado_cuenta_not_found_raises_404() -> None:
    from app.services.estado_cuenta import delete_estado_cuenta

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.estado_cuenta.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_estado_cuenta("fake-jwt", "u1", "nonexistent")

    assert exc_info.value.status_code == 404
