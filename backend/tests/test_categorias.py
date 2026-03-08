import pytest
from httpx import AsyncClient


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
