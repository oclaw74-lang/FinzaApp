"""
Tests for the recurrentes (recurring transactions) backend.

Coverage:
- Auth guards (403 without token) for all 6 endpoints
- CRUD happy paths: create, read list, read by id, update, delete
- Filter by activo
- 404 on get/update/delete of nonexistent id
- get_proximos_mes logic: mensual, diaria, semanal, quincenal,
  inactive excluded, fecha_fin expired excluded, fecha_inicio future excluded
"""

from datetime import date
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

FAKE_JWT = "fake-jwt-token"
USER_ID = "00000000-0000-0000-0000-000000000001"
REC_ID = "aaaaaaaa-0000-0000-0000-000000000001"


def _make_recurrente(
    id: str = REC_ID,
    tipo: str = "egreso",
    descripcion: str = "Netflix",
    monto: str = "299.00",
    frecuencia: str = "mensual",
    dia_del_mes: int | None = 15,
    activo: bool = True,
    fecha_inicio: str = "2026-01-01",
    fecha_fin: str | None = None,
    categoria_id: str | None = None,
) -> dict:
    return {
        "id": id,
        "user_id": USER_ID,
        "tipo": tipo,
        "descripcion": descripcion,
        "monto": monto,
        "frecuencia": frecuencia,
        "dia_del_mes": dia_del_mes,
        "activo": activo,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "categoria_id": categoria_id,
        "created_at": "2026-01-01T00:00:00+00:00",
        "updated_at": "2026-01-01T00:00:00+00:00",
    }


# ---------------------------------------------------------------------------
# Auth guard tests — no token -> 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_recurrentes_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/recurrentes")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_recurrente_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/recurrentes",
        json={
            "tipo": "egreso",
            "descripcion": "Netflix",
            "monto": 299.0,
            "frecuencia": "mensual",
            "dia_del_mes": 15,
            "fecha_inicio": "2026-01-01",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_proximos_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/recurrentes/proximos?mes=3&year=2026")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_recurrente_by_id_requires_auth(client: AsyncClient) -> None:
    response = await client.get(f"/api/v1/recurrentes/{REC_ID}")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_recurrente_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        f"/api/v1/recurrentes/{REC_ID}",
        json={"descripcion": "Disney+"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_recurrente_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(f"/api/v1/recurrentes/{REC_ID}")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Service unit tests — CRUD happy paths
# ---------------------------------------------------------------------------


def test_get_recurrentes_returns_list():
    """get_recurrentes returns all recurrentes for the user."""
    from app.services.recurrentes import get_recurrentes

    rows = [_make_recurrente()]
    mock_response = MagicMock()
    mock_response.data = rows

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .order.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_recurrentes(FAKE_JWT)

    assert len(result) == 1
    assert result[0]["id"] == REC_ID


def test_get_recurrentes_filter_activo_true():
    """get_recurrentes applies activo=True filter when provided."""
    from app.services.recurrentes import get_recurrentes

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .order.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_recurrentes(FAKE_JWT, activo=True)

    assert result == []
    mock_client.table.return_value.select.return_value.order.return_value.eq.assert_called_once_with(
        "activo", True
    )


def test_get_recurrentes_filter_activo_false():
    """get_recurrentes applies activo=False filter when provided."""
    from app.services.recurrentes import get_recurrentes

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .order.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_recurrentes(FAKE_JWT, activo=False)

    assert result == []
    mock_client.table.return_value.select.return_value.order.return_value.eq.assert_called_once_with(
        "activo", False
    )


def test_create_recurrente_success():
    """create_recurrente inserts correctly and returns the created row."""
    from app.schemas.recurrente import RecurrenteCreate
    from app.services.recurrentes import create_recurrente

    row = _make_recurrente()
    mock_response = MagicMock()
    mock_response.data = [row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response

    data = RecurrenteCreate(
        tipo="egreso",
        descripcion="Netflix",
        monto=299.0,
        frecuencia="mensual",
        dia_del_mes=15,
        fecha_inicio=date(2026, 1, 1),
    )

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = create_recurrente(FAKE_JWT, USER_ID, data)

    assert result["id"] == REC_ID
    payload = mock_client.table.return_value.insert.call_args[0][0]
    assert payload["descripcion"] == "Netflix"
    assert payload["user_id"] == USER_ID
    assert payload["monto"] == "299.0"


def test_get_recurrente_by_id_success():
    """get_recurrente_by_id returns the row when found."""
    from app.services.recurrentes import get_recurrente_by_id

    row = _make_recurrente()
    mock_response = MagicMock()
    mock_response.data = row

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .eq.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_recurrente_by_id(FAKE_JWT, REC_ID)

    assert result["id"] == REC_ID


def test_get_recurrente_by_id_not_found_raises_404():
    """get_recurrente_by_id raises 404 when the record does not exist."""
    from app.services.recurrentes import get_recurrente_by_id

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .eq.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_recurrente_by_id(FAKE_JWT, "nonexistent-id")

    assert exc_info.value.status_code == 404


def test_update_recurrente_success():
    """update_recurrente returns updated row on success."""
    from app.schemas.recurrente import RecurrenteUpdate
    from app.services.recurrentes import update_recurrente

    updated_row = _make_recurrente(descripcion="Disney+")
    mock_response = MagicMock()
    mock_response.data = [updated_row]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value
        .eq.return_value.execute.return_value
    ) = mock_response

    data = RecurrenteUpdate(descripcion="Disney+")

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = update_recurrente(FAKE_JWT, REC_ID, data)

    assert result["descripcion"] == "Disney+"


def test_update_recurrente_not_found_raises_404():
    """update_recurrente raises 404 when the record does not exist."""
    from app.schemas.recurrente import RecurrenteUpdate
    from app.services.recurrentes import update_recurrente

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value
        .eq.return_value.execute.return_value
    ) = mock_response

    data = RecurrenteUpdate(descripcion="Nuevo")

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            update_recurrente(FAKE_JWT, "nonexistent-id", data)

    assert exc_info.value.status_code == 404


def test_update_recurrente_no_fields_raises_422():
    """update_recurrente raises 422 when no fields are provided."""
    from app.schemas.recurrente import RecurrenteUpdate
    from app.services.recurrentes import update_recurrente

    mock_client = MagicMock()
    data = RecurrenteUpdate()

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            update_recurrente(FAKE_JWT, REC_ID, data)

    assert exc_info.value.status_code == 422


def test_delete_recurrente_success():
    """delete_recurrente completes without error when the record exists."""
    from app.services.recurrentes import delete_recurrente

    mock_response = MagicMock()
    mock_response.data = [_make_recurrente()]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.delete.return_value
        .eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        delete_recurrente(FAKE_JWT, REC_ID)  # should not raise


def test_delete_recurrente_not_found_raises_404():
    """delete_recurrente raises 404 when the record does not exist."""
    from app.services.recurrentes import delete_recurrente

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.delete.return_value
        .eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_recurrente(FAKE_JWT, "nonexistent-id")

    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# get_proximos_mes logic tests
# ---------------------------------------------------------------------------


def _setup_proximos_mock(rows: list[dict]) -> MagicMock:
    """Return a mock supabase client that returns the given rows for active recurrentes."""
    mock_response = MagicMock()
    mock_response.data = rows

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .eq.return_value.execute.return_value
    ) = mock_response
    return mock_client


def test_proximos_mensual_dia_del_mes_en_rango():
    """Mensual recurrente appears on its dia_del_mes for the queried month."""
    from app.services.recurrentes import get_proximos_mes

    rec = _make_recurrente(frecuencia="mensual", dia_del_mes=10, fecha_inicio="2026-01-01")
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert len(result) == 1
    assert result[0]["fecha_estimada"] == date(2026, 3, 10)


def test_proximos_mensual_dia_excede_dias_del_mes():
    """Mensual with dia_del_mes=31 in February is clamped to the last day."""
    from app.services.recurrentes import get_proximos_mes

    rec = _make_recurrente(frecuencia="mensual", dia_del_mes=31, fecha_inicio="2026-01-01")
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=2, year=2026)

    assert len(result) == 1
    # February 2026 has 28 days
    assert result[0]["fecha_estimada"] == date(2026, 2, 28)


def test_proximos_diaria_aparece():
    """Diaria recurrente appears with fecha_estimada = first day of the month."""
    from app.services.recurrentes import get_proximos_mes

    rec = _make_recurrente(frecuencia="diaria", dia_del_mes=None, fecha_inicio="2026-01-01")
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert len(result) == 1
    assert result[0]["fecha_estimada"] == date(2026, 3, 1)


def test_proximos_semanal_aparece():
    """Semanal recurrente appears with fecha_estimada = first day of the month."""
    from app.services.recurrentes import get_proximos_mes

    rec = _make_recurrente(frecuencia="semanal", dia_del_mes=None, fecha_inicio="2026-01-01")
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert len(result) == 1
    assert result[0]["fecha_estimada"] == date(2026, 3, 1)


def test_proximos_quincenal_aparece():
    """Quincenal recurrente appears with fecha_estimada = first day of the month."""
    from app.services.recurrentes import get_proximos_mes

    rec = _make_recurrente(frecuencia="quincenal", dia_del_mes=None, fecha_inicio="2026-01-01")
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert len(result) == 1
    assert result[0]["fecha_estimada"] == date(2026, 3, 1)


def test_proximos_inactivo_excluido():
    """Inactive recurrente is not returned by get_proximos_mes.

    The service queries with eq('activo', True), so an inactive recurrente
    would never be in the Supabase response. We verify the mock receives
    the filter and returns no results when only inactive rows exist.
    """
    from app.services.recurrentes import get_proximos_mes

    # Supabase already filters — the response has no rows
    mock_client = _setup_proximos_mock([])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert result == []
    # Verify the filter was applied
    mock_client.table.return_value.select.return_value.eq.assert_called_once_with(
        "activo", True
    )


def test_proximos_fecha_fin_pasada_excluida():
    """Recurrente with fecha_fin before the queried month is excluded."""
    from app.services.recurrentes import get_proximos_mes

    # fecha_fin is Jan 31 2026, queried month is March 2026 -> exclude
    rec = _make_recurrente(
        frecuencia="mensual",
        dia_del_mes=15,
        fecha_inicio="2026-01-01",
        fecha_fin="2026-01-31",
    )
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert result == []


def test_proximos_fecha_inicio_futura_excluida():
    """Recurrente with fecha_inicio after the queried month is excluded."""
    from app.services.recurrentes import get_proximos_mes

    # fecha_inicio is April 1 2026, queried month is March 2026 -> exclude
    rec = _make_recurrente(
        frecuencia="mensual",
        dia_del_mes=5,
        fecha_inicio="2026-04-01",
        fecha_fin=None,
    )
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert result == []


def test_proximos_fecha_fin_mismo_mes_incluida():
    """Recurrente with fecha_fin within the queried month is included."""
    from app.services.recurrentes import get_proximos_mes

    # fecha_fin is March 10 2026, queried month is March 2026 -> include
    rec = _make_recurrente(
        frecuencia="mensual",
        dia_del_mes=5,
        fecha_inicio="2026-01-01",
        fecha_fin="2026-03-10",
    )
    mock_client = _setup_proximos_mock([rec])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert len(result) == 1
    assert result[0]["fecha_estimada"] == date(2026, 3, 5)


def test_proximos_multiple_recurrentes_ordenados_por_fecha():
    """get_proximos_mes returns results sorted by fecha_estimada ascending."""
    from app.services.recurrentes import get_proximos_mes

    rec_dia_20 = _make_recurrente(
        id="aaaaaaaa-0000-0000-0000-000000000002",
        frecuencia="mensual",
        dia_del_mes=20,
        fecha_inicio="2026-01-01",
    )
    rec_dia_5 = _make_recurrente(
        id="aaaaaaaa-0000-0000-0000-000000000003",
        frecuencia="mensual",
        dia_del_mes=5,
        fecha_inicio="2026-01-01",
    )
    mock_client = _setup_proximos_mock([rec_dia_20, rec_dia_5])

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        result = get_proximos_mes(FAKE_JWT, mes=3, year=2026)

    assert len(result) == 2
    assert result[0]["fecha_estimada"] == date(2026, 3, 5)
    assert result[1]["fecha_estimada"] == date(2026, 3, 20)


def test_get_recurrentes_api_error_raises_500():
    """get_recurrentes raises HTTP 500 on unexpected Supabase APIError."""
    from app.services.recurrentes import get_recurrentes

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value
        .order.return_value.execute.side_effect
    ) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.recurrentes.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_recurrentes(FAKE_JWT)

    assert exc_info.value.status_code == 500


def test_create_recurrente_invalid_monto_raises_validation_error():
    """RecurrenteCreate raises ValidationError when monto <= 0."""
    from pydantic import ValidationError

    from app.schemas.recurrente import RecurrenteCreate

    with pytest.raises(ValidationError):
        RecurrenteCreate(
            tipo="egreso",
            descripcion="Test",
            monto=0.0,
            frecuencia="mensual",
            fecha_inicio=date(2026, 1, 1),
        )


def test_create_recurrente_invalid_tipo_raises_validation_error():
    """RecurrenteCreate raises ValidationError for invalid tipo."""
    from pydantic import ValidationError

    from app.schemas.recurrente import RecurrenteCreate

    with pytest.raises(ValidationError):
        RecurrenteCreate(
            tipo="gasto",  # invalid — must be ingreso or egreso
            descripcion="Test",
            monto=100.0,
            frecuencia="mensual",
            fecha_inicio=date(2026, 1, 1),
        )
