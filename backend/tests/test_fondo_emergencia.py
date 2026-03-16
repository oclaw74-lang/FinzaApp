from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_fondo_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/fondo-emergencia")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_fondo_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/fondo-emergencia", json={"monto_actual": 5000})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_depositar_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/fondo-emergencia/depositar", json={"monto": 1000})
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_retirar_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/fondo-emergencia/retirar", json={"monto": 500})
    assert response.status_code == 403


@patch("app.services.fondo_emergencia.get_user_client")
def test_create_fondo_returns_enriched(mock_client: MagicMock) -> None:
    from app.services.fondo_emergencia import create_fondo
    from app.schemas.fondo_emergencia import FondoEmergenciaCreate

    mock = MagicMock()
    mock.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "fe-1", "user_id": "u-1", "monto_actual": "5000.00",
            "meta_meses": 3, "notas": None, "created_at": "2026-01-01",
        }]
    )
    mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    mock_client.return_value = mock

    result = create_fondo("jwt", "u-1", FondoEmergenciaCreate(monto_actual=5000, meta_meses=3))
    assert result["monto_actual"] == 5000.0
    assert "meta_calculada" in result
    assert "porcentaje" in result


@patch("app.services.fondo_emergencia.get_user_client")
def test_get_or_none_returns_none_when_empty(mock_client: MagicMock) -> None:
    from app.services.fondo_emergencia import get_or_none

    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(data=None)
    mock_client.return_value = mock

    result = get_or_none("jwt", "u-1")
    assert result is None


@patch("app.services.fondo_emergencia.get_user_client")
def test_porcentaje_caps_at_100(mock_client: MagicMock) -> None:
    from app.services.fondo_emergencia import _enrich

    mock = MagicMock()
    # egresos = [] so meta_calculada = 0, porcentaje = 0
    mock.table.return_value.select.return_value.eq.return_value.execute.return_value = MagicMock(data=[])
    mock_client.return_value = mock

    row = {"id": "x", "user_id": "u", "monto_actual": "999999.00", "meta_meses": 3, "notas": None}
    result = _enrich(row, mock, "u")
    assert result["porcentaje"] == 0.0  # no egresos → meta=0 → porcentaje=0


@patch("app.services.fondo_emergencia.get_user_client")
def test_depositar_adds_monto(mock_client: MagicMock) -> None:
    from app.services.fondo_emergencia import depositar

    fondo_data = {
        "id": "fe-1", "user_id": "u-1", "monto_actual": "1000.00",
        "meta_meses": 3, "notas": None, "meta_calculada": None, "porcentaje": 0.0,
    }

    mock = MagicMock()
    q = MagicMock()
    q.execute.return_value = MagicMock(data=None)
    q.eq.return_value = q
    q.maybe_single.return_value = q
    q.select.return_value = q
    q.update.return_value = q
    # First call: get_or_none → egresos for meta calc
    mock.table.return_value = q

    with patch("app.services.fondo_emergencia.get_or_none") as mock_get, \
         patch("app.services.fondo_emergencia.update_fondo") as mock_update:
        mock_get.return_value = {**fondo_data, "monto_actual": 1000.0}
        mock_update.return_value = {**fondo_data, "monto_actual": 1500.0}
        mock_client.return_value = mock

        result = depositar("jwt", "u-1", 500.0)
        assert result["monto_actual"] == 1500.0
