from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ---------------------------------------------------------------------------
# Auth guard tests — no token -> 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_presupuestos_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/presupuestos")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_presupuesto_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/presupuestos",
        json={
            "categoria_id": "00000000-0000-0000-0000-000000000010",
            "mes": 3,
            "year": 2026,
            "monto_limite": 5000.0,
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_estado_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/presupuestos/estado?mes=3&year=2026")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_presupuesto_by_id_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/presupuestos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_presupuesto_requires_auth(client: AsyncClient) -> None:
    response = await client.put(
        "/api/v1/presupuestos/00000000-0000-0000-0000-000000000001",
        json={"monto_limite": 8000.0},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_presupuesto_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/presupuestos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Service unit tests — mock supabase client
# ---------------------------------------------------------------------------


def _make_presupuesto_row(
    id_: str = "aaaa-0001",
    user_id: str = "u1",
    categoria_id: str = "cat-0001",
    mes: int = 3,
    year: int = 2026,
    monto_limite: float = 5000.0,
) -> dict:
    return {
        "id": id_,
        "user_id": user_id,
        "categoria_id": categoria_id,
        "mes": mes,
        "year": year,
        "monto_limite": monto_limite,
        "created_at": "2026-03-09T00:00:00+00:00",
        "updated_at": "2026-03-09T00:00:00+00:00",
        "categorias": {"nombre": "Alimentacion"},
    }


# --- create_presupuesto ---


def test_create_presupuesto_success():
    """create_presupuesto inserts correctly and returns the created row."""
    from app.schemas.presupuesto import PresupuestoCreate
    from app.services.presupuestos import create_presupuesto

    inserted_row = _make_presupuesto_row()
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        mock_response
    )

    data = PresupuestoCreate(
        categoria_id="00000000-0000-0000-0000-000000000010",
        mes=3,
        year=2026,
        monto_limite=5000.0,
    )

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = create_presupuesto("fake-jwt", "u1", data)

    assert result["id"] == "aaaa-0001"
    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["user_id"] == "u1"
    assert insert_payload["mes"] == 3
    assert insert_payload["year"] == 2026
    assert insert_payload["monto_limite"] == 5000.0


def test_create_presupuesto_duplicate_raises_409():
    """create_presupuesto raises 409 on unique constraint violation."""
    from app.schemas.presupuesto import PresupuestoCreate
    from app.services.presupuestos import create_presupuesto

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "23505", "message": "duplicate key value violates unique constraint"}
    )

    data = PresupuestoCreate(
        categoria_id="00000000-0000-0000-0000-000000000010",
        mes=3,
        year=2026,
        monto_limite=5000.0,
    )

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        with pytest.raises(HTTPException) as exc_info:
            create_presupuesto("fake-jwt", "u1", data)

    assert exc_info.value.status_code == 409
    assert "categoria" in exc_info.value.detail.lower()


def test_create_presupuesto_invalid_monto_limite():
    """PresupuestoCreate raises ValidationError when monto_limite <= 0."""
    from pydantic import ValidationError

    from app.schemas.presupuesto import PresupuestoCreate

    with pytest.raises(ValidationError):
        PresupuestoCreate(
            categoria_id="00000000-0000-0000-0000-000000000010",
            mes=3,
            year=2026,
            monto_limite=0.0,
        )


def test_create_presupuesto_invalid_mes():
    """PresupuestoCreate raises ValidationError when mes is out of range."""
    from pydantic import ValidationError

    from app.schemas.presupuesto import PresupuestoCreate

    with pytest.raises(ValidationError):
        PresupuestoCreate(
            categoria_id="00000000-0000-0000-0000-000000000010",
            mes=13,
            year=2026,
            monto_limite=1000.0,
        )


# --- get_presupuestos ---


def test_get_presupuestos_returns_list():
    """get_presupuestos returns a list of budgets for the user."""
    from app.services.presupuestos import get_presupuestos

    rows = [_make_presupuesto_row()]
    mock_response = MagicMock()
    mock_response.data = rows

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.order.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = get_presupuestos("fake-jwt")

    assert len(result) == 1
    assert result[0]["id"] == "aaaa-0001"


def test_get_presupuestos_with_mes_year_filter():
    """get_presupuestos applies mes and year filters when provided."""
    from app.services.presupuestos import get_presupuestos

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.order.return_value
        .eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = get_presupuestos("fake-jwt", mes=3, year=2026)

    assert result == []


# --- get_presupuesto_by_id ---


def test_get_presupuesto_by_id_not_found_raises_404():
    """get_presupuesto_by_id raises 404 when record does not exist."""
    from app.services.presupuestos import get_presupuesto_by_id

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value
        .maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        with pytest.raises(HTTPException) as exc_info:
            get_presupuesto_by_id("fake-jwt", "nonexistent-id")

    assert exc_info.value.status_code == 404


def test_get_presupuesto_by_id_success():
    """get_presupuesto_by_id returns the presupuesto when found."""
    from app.services.presupuestos import get_presupuesto_by_id

    row = _make_presupuesto_row()
    mock_response = MagicMock()
    mock_response.data = row

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value
        .maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = get_presupuesto_by_id("fake-jwt", "aaaa-0001")

    assert result["id"] == "aaaa-0001"
    assert result["monto_limite"] == 5000.0


# --- update_presupuesto ---


def test_update_presupuesto_success():
    """update_presupuesto updates monto_limite and returns the updated row."""
    from app.schemas.presupuesto import PresupuestoUpdate
    from app.services.presupuestos import update_presupuesto

    updated_row = _make_presupuesto_row(monto_limite=8000.0)
    mock_response = MagicMock()
    mock_response.data = [updated_row]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value
    ) = mock_response

    data = PresupuestoUpdate(monto_limite=8000.0)

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = update_presupuesto("fake-jwt", "aaaa-0001", data)

    assert result["monto_limite"] == 8000.0


def test_update_presupuesto_not_found_raises_404():
    """update_presupuesto raises 404 when the record is not found."""
    from app.schemas.presupuesto import PresupuestoUpdate
    from app.services.presupuestos import update_presupuesto

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value
    ) = mock_response

    data = PresupuestoUpdate(monto_limite=8000.0)

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        with pytest.raises(HTTPException) as exc_info:
            update_presupuesto("fake-jwt", "nonexistent-id", data)

    assert exc_info.value.status_code == 404


# --- delete_presupuesto ---


def test_delete_presupuesto_success():
    """delete_presupuesto deletes without raising when the record exists."""
    from app.services.presupuestos import delete_presupuesto

    deleted_row = _make_presupuesto_row()
    mock_response = MagicMock()
    mock_response.data = [deleted_row]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        # Should not raise
        delete_presupuesto("fake-jwt", "aaaa-0001")


def test_delete_presupuesto_not_found_raises_404():
    """delete_presupuesto raises 404 when the record does not exist."""
    from app.services.presupuestos import delete_presupuesto

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.delete.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        with pytest.raises(HTTPException) as exc_info:
            delete_presupuesto("fake-jwt", "nonexistent-id")

    assert exc_info.value.status_code == 404


# --- get_estado_presupuestos ---


def test_get_estado_estructura():
    """get_estado_presupuestos returns PresupuestoEstado structure."""
    from app.services.presupuestos import get_estado_presupuestos

    presupuesto_row = {
        "id": "aaaa-0001",
        "user_id": "u1",
        "categoria_id": "cat-0001",
        "mes": 3,
        "year": 2026,
        "monto_limite": 5000.0,
        "created_at": "2026-03-09T00:00:00+00:00",
        "updated_at": "2026-03-09T00:00:00+00:00",
        "categorias": {"nombre": "Alimentacion"},
    }
    egreso_rows = [{"monto": "1500.00"}, {"monto": "500.00"}]

    mock_presupuestos_response = MagicMock()
    mock_presupuestos_response.data = [presupuesto_row]

    mock_egresos_response = MagicMock()
    mock_egresos_response.data = egreso_rows

    mock_client = MagicMock()

    def table_side_effect(table_name: str):
        m = MagicMock()
        if table_name == "presupuestos":
            (
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value
            ) = mock_presupuestos_response
        else:
            # egresos
            (
                m.select.return_value.gte.return_value.lte.return_value.execute.return_value
            ) = mock_egresos_response
        return m

    mock_client.table.side_effect = table_side_effect

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = get_estado_presupuestos("fake-jwt", mes=3, year=2026)

    assert len(result) == 1
    estado = result[0]
    assert "monto_limite" in estado
    assert "gasto_actual" in estado
    assert "porcentaje_usado" in estado
    assert "alerta" in estado
    assert "categoria_nombre" in estado
    assert estado["gasto_actual"] == 2000.0
    assert estado["monto_limite"] == 5000.0
    assert estado["porcentaje_usado"] == 40.0
    assert estado["alerta"] is False
    assert estado["categoria_nombre"] == "Alimentacion"


def test_get_estado_alerta_true_when_porcentaje_gte_80():
    """get_estado_presupuestos sets alerta=True when porcentaje_usado >= 80."""
    from app.services.presupuestos import get_estado_presupuestos

    presupuesto_row = {
        "id": "aaaa-0002",
        "user_id": "u1",
        "categoria_id": "cat-0002",
        "mes": 3,
        "year": 2026,
        "monto_limite": 1000.0,
        "created_at": "2026-03-09T00:00:00+00:00",
        "updated_at": "2026-03-09T00:00:00+00:00",
        "categorias": {"nombre": "Entretenimiento"},
    }
    # gasto = 900 sobre limite 1000 => 90% => alerta True
    egreso_rows = [{"monto": "500.00"}, {"monto": "400.00"}]

    mock_presupuestos_response = MagicMock()
    mock_presupuestos_response.data = [presupuesto_row]

    mock_egresos_response = MagicMock()
    mock_egresos_response.data = egreso_rows

    mock_client = MagicMock()

    def table_side_effect(table_name: str):
        m = MagicMock()
        if table_name == "presupuestos":
            (
                m.select.return_value.eq.return_value.eq.return_value.execute.return_value
            ) = mock_presupuestos_response
        else:
            (
                m.select.return_value.gte.return_value.lte.return_value.execute.return_value
            ) = mock_egresos_response
        return m

    mock_client.table.side_effect = table_side_effect

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = get_estado_presupuestos("fake-jwt", mes=3, year=2026)

    assert len(result) == 1
    estado = result[0]
    assert estado["gasto_actual"] == 900.0
    assert estado["porcentaje_usado"] == 90.0
    assert estado["alerta"] is True


def test_get_estado_sin_presupuestos_retorna_lista_vacia():
    """get_estado_presupuestos returns [] when no budgets exist for the month."""
    from app.services.presupuestos import get_estado_presupuestos

    mock_response = MagicMock()
    mock_response.data = []

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        result = get_estado_presupuestos("fake-jwt", mes=1, year=2026)

    assert result == []


def test_get_presupuestos_api_error_raises_500():
    """get_presupuestos raises HTTP 500 on unexpected Supabase APIError."""
    from app.services.presupuestos import get_presupuestos

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.order.return_value.execute.side_effect
    ) = APIError({"code": "503", "message": "Service unavailable"})

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        with pytest.raises(HTTPException) as exc_info:
            get_presupuestos("fake-jwt")

    assert exc_info.value.status_code == 500


def test_create_presupuesto_api_error_raises_http():
    """create_presupuesto propagates APIError as HTTPException."""
    from app.schemas.presupuesto import PresupuestoCreate
    from app.services.presupuestos import create_presupuesto

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Bad request"}
    )

    data = PresupuestoCreate(
        categoria_id="00000000-0000-0000-0000-000000000010",
        mes=3,
        year=2026,
        monto_limite=1000.0,
    )

    with patch(
        "app.services.presupuestos.get_user_client", return_value=mock_client
    ):
        with pytest.raises(HTTPException) as exc_info:
            create_presupuesto("fake-jwt", "u1", data)

    assert exc_info.value.status_code == 400
