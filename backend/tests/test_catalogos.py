import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_monedas_returns_list(client: AsyncClient) -> None:
    response = await client.get("/api/v1/catalogos/monedas")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "codigo" in first
    assert "nombre" in first
    assert "simbolo" in first
    assert "activa" in first


@pytest.mark.asyncio
async def test_get_monedas_contains_dop(client: AsyncClient) -> None:
    response = await client.get("/api/v1/catalogos/monedas")
    assert response.status_code == 200
    codigos = [m["codigo"] for m in response.json()]
    assert "DOP" in codigos
    assert "USD" in codigos


@pytest.mark.asyncio
async def test_get_paises_returns_list(client: AsyncClient) -> None:
    response = await client.get("/api/v1/catalogos/paises")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    first = data[0]
    assert "codigo" in first
    assert "nombre" in first
    assert "moneda_codigo" in first


@pytest.mark.asyncio
async def test_get_bancos_por_pais_do(client: AsyncClient) -> None:
    response = await client.get("/api/v1/catalogos/paises/DO/bancos")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    nombres = [b["nombre"] for b in data]
    assert any("Popular" in n or "BanReservas" in n or "BHD" in n for n in nombres)


@pytest.mark.asyncio
async def test_get_bancos_por_pais_case_insensitive(client: AsyncClient) -> None:
    response_upper = await client.get("/api/v1/catalogos/paises/DO/bancos")
    response_lower = await client.get("/api/v1/catalogos/paises/do/bancos")
    assert response_upper.status_code == 200
    assert response_lower.status_code == 200
    assert response_upper.json() == response_lower.json()


@pytest.mark.asyncio
async def test_get_bancos_por_pais_invalid_returns_empty(client: AsyncClient) -> None:
    response = await client.get("/api/v1/catalogos/paises/XX/bancos")
    assert response.status_code == 200
    assert response.json() == []
