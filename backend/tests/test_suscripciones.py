from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_suscripciones_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/suscripciones")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_suscripcion_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/suscripciones",
        json={"nombre": "Netflix", "monto": 500, "frecuencia": "mensual"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_resumen_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/suscripciones/resumen")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_detectar_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/suscripciones/detectar")
    assert response.status_code == 403


@patch("app.services.suscripciones.get_user_client")
def test_create_suscripcion_adds_monto_mensual(mock_client: MagicMock) -> None:
    from app.services.suscripciones import create_suscripcion
    from app.schemas.suscripcion import SuscripcionCreate

    mock = MagicMock()
    mock.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{
            "id": "s-1", "user_id": "u-1", "nombre": "Netflix",
            "monto": "500.00", "frecuencia": "mensual", "moneda": "DOP",
            "activa": True, "auto_detectada": False,
            "fecha_proximo_cobro": None, "notas": None,
        }]
    )
    mock_client.return_value = mock

    result = create_suscripcion("jwt", "u-1", SuscripcionCreate(nombre="Netflix", monto=500, frecuencia="mensual"))
    assert result["monto_mensual"] == 500.0


@patch("app.services.suscripciones.get_user_client")
def test_resumen_calculates_totals(mock_client: MagicMock) -> None:
    from app.services.suscripciones import get_resumen

    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = MagicMock(
        data=[
            {"id": "s-1", "nombre": "Netflix", "monto": "500.00", "frecuencia": "mensual",
             "moneda": "DOP", "activa": True, "auto_detectada": False, "fecha_proximo_cobro": None, "notas": None},
            {"id": "s-2", "nombre": "Spotify", "monto": "1200.00", "frecuencia": "anual",
             "moneda": "DOP", "activa": True, "auto_detectada": False, "fecha_proximo_cobro": None, "notas": None},
        ]
    )
    mock_client.return_value = mock

    result = get_resumen("jwt", "u-1")
    assert result["cantidad_activas"] == 2
    assert result["total_mensual"] > 0
    assert result["total_anual"] == round(result["total_mensual"] * 12, 2)


@patch("app.services.suscripciones.get_user_client")
def test_delete_suscripcion_not_found_raises_404(mock_client: MagicMock) -> None:
    from fastapi import HTTPException
    from app.services.suscripciones import delete_suscripcion

    mock = MagicMock()
    q = MagicMock()
    q.execute.return_value = MagicMock(data=[])
    q.eq.return_value = q
    q.delete.return_value = q
    mock.table.return_value = q
    mock_client.return_value = mock

    with pytest.raises(HTTPException) as exc:
        delete_suscripcion("jwt", "u-1", "bad-id")
    assert exc.value.status_code == 404
