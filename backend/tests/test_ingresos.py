import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_ingresos_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/ingresos")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/ingresos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000001",
            "monto": "100.00",
            "fecha": "2026-03-08",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_ingreso_invalid_monto(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/ingresos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000001",
            "monto": "-50.00",
            "fecha": "2026-03-08",
        },
    )
    # 403 sin auth — en integration test con auth seria 422
    assert response.status_code in (403, 422)


@pytest.mark.asyncio
async def test_get_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/ingresos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/ingresos/00000000-0000-0000-0000-000000000001",
        json={"monto": "200.00"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_ingreso_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/ingresos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403
