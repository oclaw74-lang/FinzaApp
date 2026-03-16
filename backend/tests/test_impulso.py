from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_evaluar_impulsos_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/egresos/evaluar-impulsos?mes=3&year=2026")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_resumen_impulso_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/egresos/resumen-impulso?mes=3&year=2026")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_clasificar_impulso_requires_auth(client: AsyncClient) -> None:
    response = await client.patch(
        "/api/v1/egresos/some-id/clasificar-impulso",
        json={"es_impulso": True},
    )
    assert response.status_code == 403


@patch("app.services.impulso.get_user_client")
def test_evaluar_impulsos_no_egresos_returns_zero(mock_client: MagicMock) -> None:
    from app.services.impulso import evaluar_impulsos

    mock = MagicMock()
    q = MagicMock()
    q.execute.return_value = MagicMock(data=[])
    q.eq.return_value = q
    q.select.return_value = q
    mock.table.return_value = q
    mock_client.return_value = mock

    result = evaluar_impulsos("jwt", "u-1", 3, 2026)
    assert result["evaluados"] == 0
    assert result["marcados_impulso"] == 0


@patch("app.services.impulso.get_user_client")
def test_resumen_impulso_empty(mock_client: MagicMock) -> None:
    from app.services.impulso import get_resumen_impulso

    mock = MagicMock()
    q = MagicMock()
    q.execute.return_value = MagicMock(data=[])
    q.eq.return_value = q
    q.select.return_value = q
    mock.table.return_value = q
    mock_client.return_value = mock

    result = get_resumen_impulso("jwt", "u-1", 3, 2026)
    assert result["cantidad_impulso"] == 0
    assert result["total_impulso"] == 0.0
    assert result["porcentaje_del_total"] == 0.0


@patch("app.services.impulso.get_user_client")
def test_resumen_impulso_calculates_correctly(mock_client: MagicMock) -> None:
    from app.services.impulso import get_resumen_impulso

    mock = MagicMock()
    q = MagicMock()
    q.execute.return_value = MagicMock(data=[
        {"monto": "1000.00", "is_impulso": True},
        {"monto": "500.00", "is_impulso": False},
        {"monto": "250.00", "is_impulso": True},
    ])
    q.eq.return_value = q
    q.select.return_value = q
    mock.table.return_value = q
    mock_client.return_value = mock

    result = get_resumen_impulso("jwt", "u-1", 3, 2026)
    assert result["cantidad_impulso"] == 2
    assert result["total_impulso"] == 1250.0
    assert round(result["porcentaje_del_total"], 1) == round(1250 / 1750 * 100, 1)


@patch("app.services.impulso.get_user_client")
def test_clasificar_impulso_not_found_raises_404(mock_client: MagicMock) -> None:
    from fastapi import HTTPException
    from app.services.impulso import clasificar_impulso

    mock = MagicMock()
    q = MagicMock()
    q.execute.return_value = MagicMock(data=[])
    q.eq.return_value = q
    q.update.return_value = q
    mock.table.return_value = q
    mock_client.return_value = mock

    with pytest.raises(HTTPException) as exc:
        clasificar_impulso("jwt", "u-1", "bad-id", True)
    assert exc.value.status_code == 404
