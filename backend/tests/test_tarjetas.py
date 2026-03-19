from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ---------------------------------------------------------------------------
# Auth guard tests — no token -> 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_tarjetas_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/tarjetas")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_tarjeta_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/tarjetas",
        json={
            "banco": "Banco Popular",
            "titular": "Juan Perez",
            "ultimos_digitos": "1234",
            "tipo": "credito",
            "red": "visa",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_tarjeta_by_id_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/tarjetas/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_tarjeta_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/tarjetas/00000000-0000-0000-0000-000000000001",
        json={"saldo_actual": 500.0},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_tarjeta_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/tarjetas/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Schema validation tests
# ---------------------------------------------------------------------------


def test_tarjeta_create_invalid_digitos_length():
    """ultimos_digitos must be exactly 4 characters."""
    from pydantic import ValidationError

    from app.schemas.tarjeta import TarjetaCreate

    with pytest.raises(ValidationError):
        TarjetaCreate(
            banco="BPD",
            titular="Test",
            ultimos_digitos="123",  # only 3 chars
            tipo="credito",
            red="visa",
        )


def test_tarjeta_create_non_numeric_digitos():
    """ultimos_digitos must contain only digits."""
    from pydantic import ValidationError

    from app.schemas.tarjeta import TarjetaCreate

    with pytest.raises(ValidationError):
        TarjetaCreate(
            banco="BPD",
            titular="Test",
            ultimos_digitos="12ab",
            tipo="credito",
            red="visa",
        )


def test_tarjeta_create_invalid_tipo():
    """tipo must be 'credito' or 'debito'."""
    from pydantic import ValidationError

    from app.schemas.tarjeta import TarjetaCreate

    with pytest.raises(ValidationError):
        TarjetaCreate(
            banco="BPD",
            titular="Test",
            ultimos_digitos="1234",
            tipo="prepagada",  # invalid
            red="visa",
        )


def test_tarjeta_create_invalid_red():
    """red must be one of visa, mastercard, amex, discover, otro."""
    from pydantic import ValidationError

    from app.schemas.tarjeta import TarjetaCreate

    with pytest.raises(ValidationError):
        TarjetaCreate(
            banco="BPD",
            titular="Test",
            ultimos_digitos="1234",
            tipo="debito",
            red="unknown_red",  # invalid
        )


def test_tarjeta_create_negative_saldo_raises():
    """saldo_actual cannot be negative."""
    from pydantic import ValidationError

    from app.schemas.tarjeta import TarjetaCreate

    with pytest.raises(ValidationError):
        TarjetaCreate(
            banco="BPD",
            titular="Test",
            ultimos_digitos="1234",
            tipo="credito",
            red="visa",
            saldo_actual=-100.0,
        )


def test_tarjeta_create_zero_limite_raises():
    """limite_credito must be greater than 0 if provided."""
    from pydantic import ValidationError

    from app.schemas.tarjeta import TarjetaCreate

    with pytest.raises(ValidationError):
        TarjetaCreate(
            banco="BPD",
            titular="Test",
            ultimos_digitos="1234",
            tipo="credito",
            red="visa",
            limite_credito=0.0,
        )


# ---------------------------------------------------------------------------
# Service unit tests — mock supabase client
# ---------------------------------------------------------------------------


def test_create_tarjeta_credito():
    """create_tarjeta inserts a credit card and sets user_id."""
    from app.schemas.tarjeta import TarjetaCreate
    from app.services.tarjetas import create_tarjeta

    inserted_row = {
        "id": "aaaa-1111",
        "user_id": "u1",
        "banco": "Banco Popular",
        "titular": "Juan Perez",
        "ultimos_digitos": "1234",
        "tipo": "credito",
        "red": "visa",
        "limite_credito": "50000.00",
        "saldo_actual": "5000.00",
        "fecha_corte": 15,
        "fecha_pago": 20,
        "color": "azul",
        "activa": True,
        "created_at": "2026-03-17T00:00:00+00:00",
        "updated_at": "2026-03-17T00:00:00+00:00",
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        mock_response
    )

    data = TarjetaCreate(
        banco="Banco Popular",
        titular="Juan Perez",
        ultimos_digitos="1234",
        tipo="credito",
        red="visa",
        limite_credito=50000.0,
        saldo_actual=5000.0,
        fecha_corte=15,
        fecha_pago=20,
    )

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = create_tarjeta("fake-jwt", "u1", data)

    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["user_id"] == "u1"
    assert insert_payload["tipo"] == "credito"
    assert insert_payload["banco"] == "Banco Popular"
    # Computed field disponible = 50000 - 5000 = 45000
    assert result["disponible"] == 45000.0


def test_create_tarjeta_debito():
    """create_tarjeta for debito card sets disponible=None."""
    from app.schemas.tarjeta import TarjetaCreate
    from app.services.tarjetas import create_tarjeta

    inserted_row = {
        "id": "bbbb-2222",
        "user_id": "u1",
        "banco": "BHD Leon",
        "titular": "Maria Lopez",
        "ultimos_digitos": "5678",
        "tipo": "debito",
        "red": "mastercard",
        "limite_credito": None,
        "saldo_actual": "10000.00",
        "fecha_corte": None,
        "fecha_pago": None,
        "color": "verde",
        "activa": True,
        "created_at": "2026-03-17T00:00:00+00:00",
        "updated_at": "2026-03-17T00:00:00+00:00",
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        mock_response
    )

    data = TarjetaCreate(
        banco="BHD Leon",
        titular="Maria Lopez",
        ultimos_digitos="5678",
        tipo="debito",
        red="mastercard",
        saldo_actual=10000.0,
        color="verde",
    )

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = create_tarjeta("fake-jwt", "u1", data)

    assert result["tipo"] == "debito"
    assert result["disponible"] is None


def test_get_tarjetas():
    """get_tarjetas returns enriched list scoped to user."""
    from app.services.tarjetas import get_tarjetas

    rows = [
        {
            "id": "cccc-3333",
            "user_id": "u1",
            "banco": "Scotiabank",
            "tipo": "credito",
            "red": "visa",
            "limite_credito": "100000.00",
            "saldo_actual": "20000.00",
            "activa": True,
        }
    ]
    mock_response = MagicMock()
    mock_response.data = rows

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = get_tarjetas("fake-jwt", "u1")

    assert len(result) == 1
    assert result[0]["id"] == "cccc-3333"
    # disponible = 100000 - 20000
    assert result[0]["disponible"] == 80000.0


def test_get_tarjeta_not_found_returns_none():
    """get_tarjeta returns None when the record does not exist."""
    from app.services.tarjetas import get_tarjeta

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = get_tarjeta("fake-jwt", "u1", "nonexistent-id")

    assert result is None


def test_update_saldo_actual():
    """update_tarjeta with saldo_actual updates the record and recalculates disponible."""
    from app.schemas.tarjeta import TarjetaUpdate
    from app.services.tarjetas import update_tarjeta

    updated_row = {
        "id": "dddd-4444",
        "user_id": "u1",
        "banco": "BPD",
        "tipo": "credito",
        "red": "visa",
        "limite_credito": "30000.00",
        "saldo_actual": "8000.00",
        "activa": True,
    }
    mock_response = MagicMock()
    mock_response.data = [updated_row]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    data = TarjetaUpdate(saldo_actual=8000.0)

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = update_tarjeta("fake-jwt", "u1", "dddd-4444", data)

    update_payload = mock_client.table.return_value.update.call_args[0][0]
    assert update_payload["saldo_actual"] == "8000.0"
    assert result is not None
    # disponible = 30000 - 8000 = 22000
    assert result["disponible"] == 22000.0


def test_update_tarjeta_no_fields_raises_422():
    """update_tarjeta raises 422 when no fields are provided."""
    from app.schemas.tarjeta import TarjetaUpdate
    from app.services.tarjetas import update_tarjeta

    mock_client = MagicMock()

    data = TarjetaUpdate()  # no fields set

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            update_tarjeta("fake-jwt", "u1", "some-id", data)

    assert exc_info.value.status_code == 422


def test_delete_tarjeta():
    """delete_tarjeta executes hard delete and does not raise when record exists."""
    from app.services.tarjetas import delete_tarjeta

    mock_response = MagicMock()
    mock_response.data = [{"id": "eeee-5555"}]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        delete_tarjeta("fake-jwt", "u1", "eeee-5555")  # should not raise


def test_delete_tarjeta_not_found_raises_404():
    """delete_tarjeta raises 404 when no rows are deleted."""
    from app.services.tarjetas import delete_tarjeta

    mock_response = MagicMock()
    mock_response.data = []  # empty = not found

    mock_client = MagicMock()
    (
        mock_client.table.return_value.delete.return_value.eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_tarjeta("fake-jwt", "u1", "nonexistent-id")

    assert exc_info.value.status_code == 404


def test_create_tarjeta_api_error_propagates():
    """create_tarjeta propagates APIError as HTTPException."""
    from app.schemas.tarjeta import TarjetaCreate
    from app.services.tarjetas import create_tarjeta

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Bad request"}
    )

    data = TarjetaCreate(
        banco="BPD",
        titular="Test",
        ultimos_digitos="1234",
        tipo="credito",
        red="visa",
    )

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            create_tarjeta("fake-jwt", "u1", data)

    assert exc_info.value.status_code == 400


def test_get_tarjetas_api_error_raises_500():
    """get_tarjetas raises HTTP 500 on unexpected Supabase APIError."""
    from app.services.tarjetas import get_tarjetas

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.execute.side_effect
    ) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_tarjetas("fake-jwt", "u1")

    assert exc_info.value.status_code == 500


# ---------------------------------------------------------------------------
# _enrich_tarjeta unit tests
# ---------------------------------------------------------------------------


class TestEnrichTarjeta:
    def test_credito_with_limite_computes_disponible(self) -> None:
        from app.services.tarjetas import _enrich_tarjeta

        row = {"tipo": "credito", "limite_credito": "50000.00", "saldo_actual": "15000.00"}
        result = _enrich_tarjeta(row)
        assert result["disponible"] == 35000.0

    def test_credito_without_limite_disponible_is_none(self) -> None:
        from app.services.tarjetas import _enrich_tarjeta

        row = {"tipo": "credito", "limite_credito": None, "saldo_actual": "500.00"}
        result = _enrich_tarjeta(row)
        assert result["disponible"] is None

    def test_debito_disponible_is_none(self) -> None:
        from app.services.tarjetas import _enrich_tarjeta

        row = {"tipo": "debito", "limite_credito": None, "saldo_actual": "10000.00"}
        result = _enrich_tarjeta(row)
        assert result["disponible"] is None

    def test_credito_zero_saldo_disponible_equals_limite(self) -> None:
        from app.services.tarjetas import _enrich_tarjeta

        row = {"tipo": "credito", "limite_credito": "20000.00", "saldo_actual": "0"}
        result = _enrich_tarjeta(row)
        assert result["disponible"] == 20000.0
