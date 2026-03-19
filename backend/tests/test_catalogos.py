from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


def _make_mock_client(data: list) -> MagicMock:
    mock_response = MagicMock()
    mock_response.data = data

    mock_client = MagicMock()

    # Chain with two .eq() calls: .table().select().eq().eq().order().execute()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .eq.return_value
     .order.return_value
     .execute.return_value) = mock_response

    # Chain with one .eq() call: .table().select().eq().order().execute()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .order.return_value
     .execute.return_value) = mock_response

    # Chain with no .eq(): .table().select().order().execute()
    (mock_client.table.return_value
     .select.return_value
     .order.return_value
     .execute.return_value) = mock_response

    return mock_client


_MONEDAS = [
    {"codigo": "DOP", "nombre": "Peso Dominicano", "simbolo": "RD$", "activa": True},
    {"codigo": "USD", "nombre": "Dólar Estadounidense", "simbolo": "$", "activa": True},
    {"codigo": "EUR", "nombre": "Euro", "simbolo": "€", "activa": True},
]

_PAISES = [
    {
        "codigo": "DO",
        "nombre": "República Dominicana",
        "moneda_codigo": "DOP",
        "activo": True,
        "monedas": {"codigo": "DOP", "nombre": "Peso Dominicano", "simbolo": "RD$", "activa": True},
    },
    {
        "codigo": "US",
        "nombre": "Estados Unidos",
        "moneda_codigo": "USD",
        "activo": True,
        "monedas": {"codigo": "USD", "nombre": "Dólar Estadounidense", "simbolo": "$", "activa": True},
    },
]

_BANCOS_DO = [
    {"id": "11111111-1111-1111-1111-111111111111", "nombre": "Banco Popular Dominicano", "pais_codigo": "DO", "activo": True},
    {"id": "22222222-2222-2222-2222-222222222222", "nombre": "BanReservas", "pais_codigo": "DO", "activo": True},
    {"id": "33333333-3333-3333-3333-333333333333", "nombre": "BHD León", "pais_codigo": "DO", "activo": True},
]


@pytest.mark.asyncio
async def test_get_monedas_returns_list(client: AsyncClient) -> None:
    mock_client = _make_mock_client(_MONEDAS)
    with patch("app.api.v1.routes.catalogos.get_admin_client", return_value=mock_client):
        response = await client.get("/api/v1/catalogos/monedas")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    first = data[0]
    assert "codigo" in first
    assert "nombre" in first
    assert "simbolo" in first
    assert "activa" in first


@pytest.mark.asyncio
async def test_get_monedas_contains_dop(client: AsyncClient) -> None:
    mock_client = _make_mock_client(_MONEDAS)
    with patch("app.api.v1.routes.catalogos.get_admin_client", return_value=mock_client):
        response = await client.get("/api/v1/catalogos/monedas")
    assert response.status_code == 200
    codigos = [m["codigo"] for m in response.json()]
    assert "DOP" in codigos
    assert "USD" in codigos


@pytest.mark.asyncio
async def test_get_paises_returns_list(client: AsyncClient) -> None:
    mock_client = _make_mock_client(_PAISES)
    with patch("app.api.v1.routes.catalogos.get_admin_client", return_value=mock_client):
        response = await client.get("/api/v1/catalogos/paises")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2
    first = data[0]
    assert "codigo" in first
    assert "nombre" in first
    assert "moneda_codigo" in first


@pytest.mark.asyncio
async def test_get_bancos_por_pais_do(client: AsyncClient) -> None:
    mock_client = _make_mock_client(_BANCOS_DO)
    with patch("app.api.v1.routes.catalogos.get_admin_client", return_value=mock_client):
        response = await client.get("/api/v1/catalogos/paises/DO/bancos")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
    nombres = [b["nombre"] for b in data]
    assert any("Popular" in n or "BanReservas" in n or "BHD" in n for n in nombres)


@pytest.mark.asyncio
async def test_get_bancos_por_pais_case_insensitive(client: AsyncClient) -> None:
    mock_client = _make_mock_client(_BANCOS_DO)
    with patch("app.api.v1.routes.catalogos.get_admin_client", return_value=mock_client):
        response_upper = await client.get("/api/v1/catalogos/paises/DO/bancos")
        response_lower = await client.get("/api/v1/catalogos/paises/do/bancos")
    assert response_upper.status_code == 200
    assert response_lower.status_code == 200
    assert response_upper.json() == response_lower.json()


@pytest.mark.asyncio
async def test_get_bancos_por_pais_invalid_returns_empty(client: AsyncClient) -> None:
    mock_client = _make_mock_client([])
    with patch("app.api.v1.routes.catalogos.get_admin_client", return_value=mock_client):
        response = await client.get("/api/v1/catalogos/paises/XX/bancos")
    assert response.status_code == 200
    assert response.json() == []
