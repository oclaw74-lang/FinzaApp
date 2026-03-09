from decimal import Decimal
from unittest.mock import MagicMock, call, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ---------------------------------------------------------------------------
# Auth guard tests — no token -> 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_metas_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/metas")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_meta_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/metas",
        json={
            "nombre": "Fondo de emergencia",
            "monto_objetivo": "50000.00",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_resumen_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/metas/resumen")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_meta_by_id_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/metas/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_meta_requires_auth(client: AsyncClient) -> None:
    response = await client.delete("/api/v1/metas/00000000-0000-0000-0000-000000000001")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Service unit tests — mock supabase client
# ---------------------------------------------------------------------------


def test_create_meta_success():
    """create_meta inserts correctly and returns the created row."""
    from app.schemas.meta_ahorro import MetaAhorroCreate
    from app.services.metas_ahorro import create_meta

    inserted_row = {
        "id": "aaaa-1111",
        "user_id": "u1",
        "nombre": "Vacaciones",
        "descripcion": None,
        "monto_objetivo": "30000.00",
        "monto_actual": "0",
        "fecha_inicio": "2026-03-09",
        "fecha_objetivo": None,
        "estado": "activa",
        "color": None,
        "icono": None,
        "created_at": "2026-03-09T00:00:00+00:00",
        "updated_at": "2026-03-09T00:00:00+00:00",
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = mock_response

    data = MetaAhorroCreate(
        nombre="Vacaciones",
        monto_objetivo=Decimal("30000.00"),
    )

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = create_meta("fake-jwt", data)

    assert result["id"] == "aaaa-1111"
    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["nombre"] == "Vacaciones"
    assert insert_payload["monto_objetivo"] == "30000.00"


def test_create_meta_monto_objetivo_zero_raises_validation_error():
    """MetaAhorroCreate raises ValidationError when monto_objetivo <= 0."""
    from pydantic import ValidationError

    from app.schemas.meta_ahorro import MetaAhorroCreate

    with pytest.raises(ValidationError):
        MetaAhorroCreate(nombre="Meta inválida", monto_objetivo=Decimal("0"))


def test_create_meta_nombre_empty_raises_validation_error():
    """MetaAhorroCreate raises ValidationError when nombre is empty."""
    from pydantic import ValidationError

    from app.schemas.meta_ahorro import MetaAhorroCreate

    with pytest.raises(ValidationError):
        MetaAhorroCreate(nombre="   ", monto_objetivo=Decimal("1000.00"))


def test_get_metas_returns_list():
    """get_metas returns a list of savings goals for the user."""
    from app.services.metas_ahorro import get_metas

    metas_data = [
        {
            "id": "bbbb-2222",
            "user_id": "u1",
            "nombre": "Auto",
            "monto_objetivo": "500000.00",
            "monto_actual": "50000.00",
            "estado": "activa",
        }
    ]
    mock_response = MagicMock()
    mock_response.data = metas_data

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.order.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = get_metas("fake-jwt")

    assert len(result) == 1
    assert result[0]["id"] == "bbbb-2222"


def test_get_metas_with_estado_filter():
    """get_metas applies estado filter when provided."""
    from app.services.metas_ahorro import get_metas

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.order.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = get_metas("fake-jwt", estado="completada")

    assert result == []
    mock_client.table.return_value.select.return_value.order.return_value.eq.assert_called_once_with(
        "estado", "completada"
    )


def test_get_meta_by_id_not_found_raises_404():
    """get_meta_by_id raises 404 when record does not exist."""
    from app.services.metas_ahorro import get_meta_by_id

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_meta_by_id("fake-jwt", "nonexistent-id")

    assert exc_info.value.status_code == 404


def test_get_meta_by_id_success():
    """get_meta_by_id returns the meta when found."""
    from app.services.metas_ahorro import get_meta_by_id

    meta_data = {"id": "cccc-3333", "nombre": "Casa", "estado": "activa"}
    mock_response = MagicMock()
    mock_response.data = meta_data

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = get_meta_by_id("fake-jwt", "cccc-3333")

    assert result["id"] == "cccc-3333"


def test_update_meta_no_fields_raises_422():
    """update_meta raises 422 when no fields are provided."""
    from app.schemas.meta_ahorro import MetaAhorroUpdate
    from app.services.metas_ahorro import update_meta

    mock_client = MagicMock()

    data = MetaAhorroUpdate()

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            update_meta("fake-jwt", "meta-id", data)

    assert exc_info.value.status_code == 422


def test_update_meta_not_found_raises_404():
    """update_meta raises 404 when the record is not found."""
    from app.schemas.meta_ahorro import MetaAhorroUpdate
    from app.services.metas_ahorro import update_meta

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value
    ) = mock_response

    data = MetaAhorroUpdate(nombre="Nuevo nombre")

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            update_meta("fake-jwt", "nonexistent-id", data)

    assert exc_info.value.status_code == 404


def test_agregar_contribucion_deposito_calls_rpc():
    """agregar_contribucion (deposito) calls the agregar_contribucion_meta RPC."""
    from app.schemas.meta_ahorro import ContribucionMetaCreate
    from app.services.metas_ahorro import agregar_contribucion

    contribucion_row = {
        "id": "dddd-4444",
        "meta_id": "meta-id-1",
        "monto": "5000.00",
        "tipo": "deposito",
        "fecha": "2026-03-09",
        "notas": None,
        "created_at": "2026-03-09T00:00:00+00:00",
    }
    mock_rpc_response = MagicMock()
    mock_rpc_response.data = None

    mock_contribucion_response = MagicMock()
    mock_contribucion_response.data = [contribucion_row]

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value = mock_rpc_response
    (
        mock_client.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value
    ) = mock_contribucion_response

    data = ContribucionMetaCreate(
        monto=Decimal("5000.00"),
        tipo="deposito",
        fecha="2026-03-09",
    )

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = agregar_contribucion("fake-jwt", "meta-id-1", data)

    assert result["id"] == "dddd-4444"
    mock_client.rpc.assert_called_once_with(
        "agregar_contribucion_meta",
        {
            "p_meta_id": "meta-id-1",
            "p_monto": 5000.0,
            "p_tipo": "deposito",
            "p_fecha": "2026-03-09",
            "p_notas": "",
        },
    )


def test_agregar_contribucion_retiro_excede_monto_raises_400():
    """agregar_contribucion raises 400 when retiro exceeds monto_actual."""
    from app.schemas.meta_ahorro import ContribucionMetaCreate
    from app.services.metas_ahorro import agregar_contribucion

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "P0001", "message": "El monto de retiro (5000) supera el monto actual (1000)"}
    )

    data = ContribucionMetaCreate(
        monto=Decimal("5000.00"),
        tipo="retiro",
        fecha="2026-03-09",
    )

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            agregar_contribucion("fake-jwt", "meta-id-1", data)

    assert exc_info.value.status_code == 400
    assert "retiro" in exc_info.value.detail.lower()


def test_agregar_contribucion_meta_not_found_raises_404():
    """agregar_contribucion raises 404 when RPC reports meta not found."""
    from app.schemas.meta_ahorro import ContribucionMetaCreate
    from app.services.metas_ahorro import agregar_contribucion

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "P0001", "message": "Meta no encontrada o no pertenece al usuario"}
    )

    data = ContribucionMetaCreate(
        monto=Decimal("100.00"),
        tipo="deposito",
        fecha="2026-03-09",
    )

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            agregar_contribucion("fake-jwt", "nonexistent-meta", data)

    assert exc_info.value.status_code == 404


def test_delete_contribucion_not_found_raises_404():
    """delete_contribucion raises 404 when the contribucion does not exist."""
    from app.services.metas_ahorro import delete_contribucion

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_contribucion("fake-jwt", "meta-id", "nonexistent-contribucion")

    assert exc_info.value.status_code == 404


def test_delete_meta_with_contribuciones_raises_400():
    """delete_meta raises 400 when the meta has existing contribuciones."""
    from app.services.metas_ahorro import delete_meta

    # Simular que la consulta de contribuciones devuelve datos
    mock_contribuciones_response = MagicMock()
    mock_contribuciones_response.data = [{"id": "contrib-1"}]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.limit.return_value.execute.return_value
    ) = mock_contribuciones_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_meta("fake-jwt", "meta-id")

    assert exc_info.value.status_code == 400
    assert "contribuciones" in exc_info.value.detail.lower()


def test_delete_meta_not_found_raises_404():
    """delete_meta raises 404 when the meta does not exist."""
    from app.services.metas_ahorro import delete_meta

    # Sin contribuciones
    mock_no_contrib = MagicMock()
    mock_no_contrib.data = []

    # Sin meta (delete devuelve vacío)
    mock_delete_response = MagicMock()
    mock_delete_response.data = []

    mock_client = MagicMock()

    def table_side_effect(table_name: str):
        if table_name == "contribuciones_meta":
            m = MagicMock()
            m.select.return_value.eq.return_value.limit.return_value.execute.return_value = mock_no_contrib
            return m
        else:
            m = MagicMock()
            m.delete.return_value.eq.return_value.execute.return_value = mock_delete_response
            return m

    mock_client.table.side_effect = table_side_effect

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_meta("fake-jwt", "nonexistent-meta")

    assert exc_info.value.status_code == 404


def test_get_resumen_estructura():
    """get_resumen returns the expected MetasResumen structure."""
    from app.services.metas_ahorro import get_resumen

    metas_data = [
        {"estado": "activa", "monto_actual": "10000.00", "monto_objetivo": "50000.00"},
        {"estado": "activa", "monto_actual": "25000.00", "monto_objetivo": "50000.00"},
        {"estado": "completada", "monto_actual": "30000.00", "monto_objetivo": "30000.00"},
        {"estado": "cancelada", "monto_actual": "5000.00", "monto_objetivo": "20000.00"},
    ]

    mock_response = MagicMock()
    mock_response.data = metas_data

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = get_resumen("fake-jwt")

    assert "total_ahorrado" in result
    assert "metas_activas" in result
    assert "metas_completadas" in result
    assert "porcentaje_promedio_cumplimiento" in result

    assert result["metas_activas"] == 2
    assert result["metas_completadas"] == 1
    # total_ahorrado suma todas las metas
    assert Decimal(result["total_ahorrado"]) == Decimal("70000.00")
    # porcentaje promedio solo de activas: (20% + 50%) / 2 = 35%
    assert result["porcentaje_promedio_cumplimiento"] == 35.0


def test_get_resumen_sin_metas_activas():
    """get_resumen returns 0 porcentaje when there are no active goals."""
    from app.services.metas_ahorro import get_resumen

    metas_data = [
        {"estado": "completada", "monto_actual": "1000.00", "monto_objetivo": "1000.00"},
    ]

    mock_response = MagicMock()
    mock_response.data = metas_data

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        result = get_resumen("fake-jwt")

    assert result["metas_activas"] == 0
    assert result["metas_completadas"] == 1
    assert result["porcentaje_promedio_cumplimiento"] == 0.0


def test_get_metas_api_error_raises_500():
    """get_metas raises HTTP 500 on unexpected Supabase APIError."""
    from app.services.metas_ahorro import get_metas

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.order.return_value.execute.side_effect
    ) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_metas("fake-jwt")

    assert exc_info.value.status_code == 500


def test_create_meta_api_error_raises_http():
    """create_meta propagates APIError as HTTPException."""
    from app.schemas.meta_ahorro import MetaAhorroCreate
    from app.services.metas_ahorro import create_meta

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Bad request"}
    )

    data = MetaAhorroCreate(nombre="Test", monto_objetivo=Decimal("1000.00"))

    with patch("app.services.metas_ahorro.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            create_meta("fake-jwt", data)

    assert exc_info.value.status_code == 400
