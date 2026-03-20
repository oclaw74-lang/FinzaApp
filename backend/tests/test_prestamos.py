from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ---------------------------------------------------------------------------
# Auth guard tests — no token → 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_prestamos_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/prestamos")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_prestamo_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/prestamos",
        json={
            "tipo": "me_deben",
            "persona": "Juan",
            "monto_original": "1000.00",
            "fecha_prestamo": "2026-03-09",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_resumen_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/prestamos/resumen")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_get_prestamo_by_id_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/prestamos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_prestamo_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/prestamos/00000000-0000-0000-0000-000000000001"
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Service unit tests — mock supabase client
# ---------------------------------------------------------------------------


def test_create_prestamo_me_deben_sets_monto_pendiente():
    """Creating a me_deben loan sets monto_pendiente equal to monto_original."""
    from app.schemas.prestamo import PrestamoCreate
    from app.services.prestamos import create_prestamo

    inserted_row = {
        "id": "aaaa-1111",
        "user_id": "u1",
        "tipo": "me_deben",
        "persona": "Ana",
        "monto_original": "500.00",
        "monto_pendiente": "500.00",
        "moneda": "DOP",
        "fecha_prestamo": "2026-03-09",
        "fecha_vencimiento": None,
        "descripcion": None,
        "estado": "activo",
        "notas": None,
        "created_at": "2026-03-09T00:00:00+00:00",
        "updated_at": "2026-03-09T00:00:00+00:00",
        "deleted_at": None,
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        mock_response
    )

    data = PrestamoCreate(
        tipo="me_deben",
        persona="Ana",
        monto_original=Decimal("500.00"),
        fecha_prestamo="2026-03-09",
    )

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = create_prestamo("fake-jwt", "u1", data)

    assert result["id"] == "aaaa-1111"
    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["user_id"] == "u1"
    assert insert_payload["tipo"] == "me_deben"
    # monto_pendiente debe ser igual a monto_original al crear
    assert insert_payload["monto_pendiente"] == insert_payload["monto_original"]


def test_create_prestamo_yo_debo():
    """Creating a yo_debo loan works the same as me_deben."""
    from app.schemas.prestamo import PrestamoCreate
    from app.services.prestamos import create_prestamo

    inserted_row = {
        "id": "bbbb-2222",
        "user_id": "u1",
        "tipo": "yo_debo",
        "persona": "Pedro",
        "monto_original": "2000.00",
        "monto_pendiente": "2000.00",
        "moneda": "DOP",
        "fecha_prestamo": "2026-03-09",
        "fecha_vencimiento": None,
        "descripcion": None,
        "estado": "activo",
        "notas": None,
        "created_at": "2026-03-09T00:00:00+00:00",
        "updated_at": "2026-03-09T00:00:00+00:00",
        "deleted_at": None,
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        mock_response
    )

    data = PrestamoCreate(
        tipo="yo_debo",
        persona="Pedro",
        monto_original=Decimal("2000.00"),
        fecha_prestamo="2026-03-09",
    )

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = create_prestamo("fake-jwt", "u1", data)

    assert result["tipo"] == "yo_debo"
    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload["tipo"] == "yo_debo"
    assert insert_payload["monto_pendiente"] == insert_payload["monto_original"]


def test_get_prestamo_not_found_returns_none():
    """get_prestamo returns None when the record does not exist."""
    from app.services.prestamos import get_prestamo

    mock_response = MagicMock()
    mock_response.data = None

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.eq.return_value.is_.return_value.maybe_single.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = get_prestamo("fake-jwt", "u1", "nonexistent-id")

    assert result is None


def test_registrar_pago_parcial_reduces_monto_pendiente():
    """registrar_pago via RPC returns reduced monto_pendiente for a partial payment."""
    from app.schemas.prestamo import PagoPrestamoCreate
    from app.services.prestamos import registrar_pago

    rpc_result = {
        "pago_id": "cccc-3333",
        "monto_pendiente": 700.00,
        "estado": "activo",
    }
    mock_response = MagicMock()
    mock_response.data = rpc_result

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value = mock_response

    data = PagoPrestamoCreate(monto=Decimal("300.00"), fecha="2026-03-09")

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = registrar_pago("fake-jwt", "u1", "prestamo-id-1", data)

    assert result["monto_pendiente"] == 700.00
    assert result["estado"] == "activo"
    # Verify RPC was called with correct function name
    mock_client.rpc.assert_called_once_with(
        "registrar_pago_prestamo",
        {
            "p_prestamo_id": "prestamo-id-1",
            "p_user_id": "u1",
            "p_monto": "300.00",
            "p_fecha": "2026-03-09",
            "p_notas": None,
        },
    )


def test_registrar_pago_completo_estado_pagado():
    """registrar_pago returns estado=pagado when monto equals monto_pendiente."""
    from app.schemas.prestamo import PagoPrestamoCreate
    from app.services.prestamos import registrar_pago

    rpc_result = {
        "pago_id": "dddd-4444",
        "monto_pendiente": 0.00,
        "estado": "pagado",
    }
    mock_response = MagicMock()
    mock_response.data = rpc_result

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value = mock_response

    data = PagoPrestamoCreate(monto=Decimal("1000.00"), fecha="2026-03-09")

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = registrar_pago("fake-jwt", "u1", "prestamo-id-2", data)

    assert result["monto_pendiente"] == 0.00
    assert result["estado"] == "pagado"


def test_registrar_pago_yo_debo_creates_egreso_with_prestamo_category():
    """For yo_debo loans, registrar_pago must create an egreso (not an ingreso)
    using the 'Pago de Préstamo' system category."""
    from app.schemas.prestamo import PagoPrestamoCreate
    from app.services.prestamos import registrar_pago

    rpc_result = {"pago_id": "pago-yo-debo", "monto_pendiente": 700.0, "estado": "activo"}
    mock_rpc_response = MagicMock()
    mock_rpc_response.data = rpc_result

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value = mock_rpc_response

    # Table-specific mocks
    prestamo_mock = MagicMock()
    prestamo_mock.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
        "tipo": "yo_debo",
        "persona": "Pedro",
        "descripcion": "Deuda personal",
    }

    cat_mock = MagicMock()
    cat_mock.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value.data = [
        {"id": "cat-pago-prestamo-id"}
    ]

    egreso_mock = MagicMock()
    ingreso_mock = MagicMock()

    def table_side_effect(name: str):
        if name == "prestamos":
            return prestamo_mock
        if name == "categorias":
            return cat_mock
        if name == "egresos":
            return egreso_mock
        if name == "ingresos":
            return ingreso_mock
        return MagicMock()

    mock_client.table.side_effect = table_side_effect

    data = PagoPrestamoCreate(monto=Decimal("300.00"), fecha="2026-03-09")

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = registrar_pago("fake-jwt", "u1", "prestamo-id", data)

    assert result["monto_pendiente"] == 700.0
    # yo_debo → debe crear egreso, NO ingreso
    egreso_mock.insert.assert_called_once()
    ingreso_mock.insert.assert_not_called()

    # Verificar payload del egreso
    egreso_insert_payload = egreso_mock.insert.call_args[0][0]
    assert egreso_insert_payload["user_id"] == "u1"
    assert egreso_insert_payload["monto"] == "300.00"
    assert egreso_insert_payload["categoria_id"] == "cat-pago-prestamo-id"
    assert "Pedro" in egreso_insert_payload["descripcion"]


def test_registrar_pago_me_deben_creates_ingreso_with_cobro_category():
    """For me_deben loans, registrar_pago must create an ingreso (not an egreso)
    using the 'Cobro de Préstamo' system category."""
    from app.schemas.prestamo import PagoPrestamoCreate
    from app.services.prestamos import registrar_pago

    rpc_result = {"pago_id": "pago-me-deben", "monto_pendiente": 500.0, "estado": "activo"}
    mock_rpc_response = MagicMock()
    mock_rpc_response.data = rpc_result

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value = mock_rpc_response

    prestamo_mock = MagicMock()
    prestamo_mock.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
        "tipo": "me_deben",
        "persona": "Juan",
        "descripcion": "Préstamo de oficina",
    }

    cat_mock = MagicMock()
    cat_mock.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value.data = [
        {"id": "cat-cobro-prestamo-id"}
    ]

    egreso_mock = MagicMock()
    ingreso_mock = MagicMock()

    def table_side_effect(name: str):
        if name == "prestamos":
            return prestamo_mock
        if name == "categorias":
            return cat_mock
        if name == "egresos":
            return egreso_mock
        if name == "ingresos":
            return ingreso_mock
        return MagicMock()

    mock_client.table.side_effect = table_side_effect

    data = PagoPrestamoCreate(monto=Decimal("200.00"), fecha="2026-03-10")

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = registrar_pago("fake-jwt", "u1", "prestamo-id-me-deben", data)

    assert result["monto_pendiente"] == 500.0
    # me_deben → debe crear ingreso, NO egreso
    ingreso_mock.insert.assert_called_once()
    egreso_mock.insert.assert_not_called()

    # Verificar payload del ingreso
    ingreso_insert_payload = ingreso_mock.insert.call_args[0][0]
    assert ingreso_insert_payload["user_id"] == "u1"
    assert ingreso_insert_payload["monto"] == "200.00"
    assert ingreso_insert_payload["categoria_id"] == "cat-cobro-prestamo-id"
    assert "Juan" in ingreso_insert_payload["descripcion"]
    assert "Préstamo de oficina" in ingreso_insert_payload["descripcion"]
    # ingreso no debe tener metodo_pago ni pago_prestamo_id
    assert "metodo_pago" not in ingreso_insert_payload


def test_registrar_pago_me_deben_sin_descripcion_no_falla():
    """me_deben payment with no descripcion should still create ingreso successfully."""
    from app.schemas.prestamo import PagoPrestamoCreate
    from app.services.prestamos import registrar_pago

    rpc_result = {"pago_id": "pago-p", "monto_pendiente": 0.0, "estado": "pagado"}
    mock_rpc_response = MagicMock()
    mock_rpc_response.data = rpc_result

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value = mock_rpc_response

    prestamo_mock = MagicMock()
    prestamo_mock.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value.data = {
        "tipo": "me_deben",
        "persona": "Maria",
        "descripcion": None,  # sin descripcion
    }

    cat_mock = MagicMock()
    cat_mock.select.return_value.eq.return_value.is_.return_value.limit.return_value.execute.return_value.data = [
        {"id": "cat-cobro-id"}
    ]

    ingreso_mock = MagicMock()

    def table_side_effect(name: str):
        if name == "prestamos":
            return prestamo_mock
        if name == "categorias":
            return cat_mock
        if name == "ingresos":
            return ingreso_mock
        return MagicMock()

    mock_client.table.side_effect = table_side_effect

    data = PagoPrestamoCreate(monto=Decimal("100.00"), fecha="2026-03-11")

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = registrar_pago("fake-jwt", "u1", "prestamo-sin-desc", data)

    assert result["estado"] == "pagado"
    ingreso_mock.insert.assert_called_once()
    ingreso_payload = ingreso_mock.insert.call_args[0][0]
    # sin descripcion → solo "Pago recibido: Maria" sin el "—"
    assert ingreso_payload["descripcion"] == "Pago recibido: Maria"


def test_registrar_pago_excede_pendiente_raises_400():
    """registrar_pago raises 400 when the RPC signals monto exceeds monto_pendiente."""
    from app.schemas.prestamo import PagoPrestamoCreate
    from app.services.prestamos import registrar_pago

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "P0001", "message": "Monto (500) excede el pendiente (300)"}
    )

    data = PagoPrestamoCreate(monto=Decimal("500.00"), fecha="2026-03-09")

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            registrar_pago("fake-jwt", "u1", "prestamo-id-3", data)

    assert exc_info.value.status_code == 400
    assert "excede" in exc_info.value.detail.lower()


def test_get_resumen_estructura():
    """get_resumen returns the expected flat PrestamoResumen structure."""
    from app.services.prestamos import get_resumen

    prestamos_data = [
        {
            "tipo": "me_deben",
            "estado": "activo",
            "monto_original": "1000.00",
            "monto_pendiente": "700.00",
        },
        {
            "tipo": "me_deben",
            "estado": "pagado",
            "monto_original": "500.00",
            "monto_pendiente": "0.00",
        },
        {
            "tipo": "yo_debo",
            "estado": "activo",
            "monto_original": "2000.00",
            "monto_pendiente": "2000.00",
        },
        {
            "tipo": "yo_debo",
            "estado": "vencido",
            "monto_original": "300.00",
            "monto_pendiente": "300.00",
        },
    ]

    mock_response = MagicMock()
    mock_response.data = prestamos_data

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.is_.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = get_resumen("fake-jwt", "u1")

    # Flat structure
    assert "total_me_deben" in result
    assert "total_yo_debo" in result
    assert "cantidad_activos" in result
    assert "cantidad_vencidos" in result

    # total_me_deben: solo activos con monto_pendiente
    assert result["total_me_deben"] == 700.0
    # total_yo_debo: solo activos con monto_pendiente
    assert result["total_yo_debo"] == 2000.0
    # cantidad_activos: 1 me_deben activo + 1 yo_debo activo
    assert result["cantidad_activos"] == 2
    # cantidad_vencidos: 1 yo_debo vencido
    assert result["cantidad_vencidos"] == 1


def test_delete_prestamo_soft_delete():
    """delete_prestamo sets deleted_at and does not raise when record exists."""
    from app.services.prestamos import delete_prestamo

    mock_response = MagicMock()
    mock_response.data = [
        {"id": "eeee-5555", "deleted_at": "2026-03-09T00:00:00+00:00"}
    ]

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = delete_prestamo("fake-jwt", "u1", "eeee-5555")

    assert result["id"] == "eeee-5555"
    assert "deleted_at" in result
    update_payload = mock_client.table.return_value.update.call_args[0][0]
    assert "deleted_at" in update_payload


def test_delete_prestamo_not_found_raises_404():
    """delete_prestamo raises 404 when no rows are updated (record not found)."""
    from app.services.prestamos import delete_prestamo

    mock_response = MagicMock()
    mock_response.data = []  # empty = not found

    mock_client = MagicMock()
    (
        mock_client.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_prestamo("fake-jwt", "u1", "nonexistent-id")

    assert exc_info.value.status_code == 404


def test_get_prestamos_list_returns_items():
    """get_prestamos returns a list of loans for the user."""
    from app.services.prestamos import get_prestamos

    prestamos_data = [
        {
            "id": "ffff-6666",
            "user_id": "u1",
            "tipo": "me_deben",
            "persona": "Carlos",
            "monto_original": "800.00",
            "monto_pendiente": "800.00",
            "estado": "activo",
        }
    ]
    mock_response = MagicMock()
    mock_response.data = prestamos_data

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.is_.return_value.order.return_value.execute.return_value
    ) = mock_response

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = get_prestamos("fake-jwt", "u1")

    assert len(result) == 1
    assert result[0]["id"] == "ffff-6666"


def test_get_prestamos_api_error_raises_500():
    """get_prestamos raises HTTP 500 on unexpected Supabase APIError."""
    from app.services.prestamos import get_prestamos

    mock_client = MagicMock()
    (
        mock_client.table.return_value.select.return_value.eq.return_value.is_.return_value.order.return_value.execute.side_effect
    ) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_prestamos("fake-jwt", "u1")

    assert exc_info.value.status_code == 500


def test_create_prestamo_api_error_raises_http():
    """create_prestamo propagates APIError as HTTPException."""
    from app.schemas.prestamo import PrestamoCreate
    from app.services.prestamos import create_prestamo

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Bad request"}
    )

    data = PrestamoCreate(
        tipo="me_deben",
        persona="Test",
        monto_original=Decimal("100.00"),
        fecha_prestamo="2026-03-09",
    )

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            create_prestamo("fake-jwt", "u1", data)

    assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# _calc_cuota_mensual unit tests
# ---------------------------------------------------------------------------


class TestCalcCuotaMensual:
    def test_with_interest_rate(self) -> None:
        """French amortization with 12% annual over 12 months."""
        from app.services.prestamos import _calc_cuota_mensual

        cuota = _calc_cuota_mensual(12000.0, 12.0, 12)
        assert cuota is not None
        # Monthly rate 1%, expected cuota ~1066.19
        assert 1060.0 < cuota < 1075.0

    def test_without_interest_simple_division(self) -> None:
        """No interest: cuota = monto / plazo."""
        from app.services.prestamos import _calc_cuota_mensual

        cuota = _calc_cuota_mensual(12000.0, None, 12)
        assert cuota == 1000.0

    def test_zero_interest_uses_simple_division(self) -> None:
        """Explicit 0% interest falls back to simple division."""
        from app.services.prestamos import _calc_cuota_mensual

        cuota = _calc_cuota_mensual(6000.0, 0.0, 6)
        assert cuota == 1000.0

    def test_none_plazo_returns_none(self) -> None:
        """Returns None when plazo_meses is not provided."""
        from app.services.prestamos import _calc_cuota_mensual

        assert _calc_cuota_mensual(1000.0, 18.0, None) is None

    def test_zero_plazo_returns_none(self) -> None:
        """Returns None when plazo_meses is 0."""
        from app.services.prestamos import _calc_cuota_mensual

        assert _calc_cuota_mensual(1000.0, 18.0, 0) is None


# ---------------------------------------------------------------------------
# _calc_proximo_pago unit tests
# ---------------------------------------------------------------------------


class TestCalcProximoPago:
    def test_no_payments_returns_future_date(self) -> None:
        """Without payments, next date is at least today."""
        from app.services.prestamos import _calc_proximo_pago

        fecha_inicio = date(2020, 1, 15)
        result = _calc_proximo_pago(fecha_inicio, [], 12)
        assert result is not None
        assert result >= date.today()
        assert result.day == 15

    def test_with_last_payment_advances_one_month(self) -> None:
        """With a last payment on Jan 10, next should be Feb 10."""
        from app.services.prestamos import _calc_proximo_pago

        fecha_inicio = date(2026, 1, 10)
        pagos = [{"fecha": "2026-01-10"}]
        result = _calc_proximo_pago(fecha_inicio, pagos, 6)
        assert result is not None
        assert result.month == 2
        assert result.day == 10

    def test_past_first_payment_advances_to_future(self) -> None:
        """Loan started long ago with no payments: next must be in the future."""
        from app.services.prestamos import _calc_proximo_pago

        fecha_inicio = date(2023, 3, 5)
        result = _calc_proximo_pago(fecha_inicio, [], 36)
        assert result is not None
        assert result >= date.today()

    def test_none_plazo_returns_none(self) -> None:
        """Returns None when plazo_meses is None."""
        from app.services.prestamos import _calc_proximo_pago

        assert _calc_proximo_pago(date(2026, 1, 1), [], None) is None

    def test_day_clamped_at_month_end(self) -> None:
        """Day 31 in a month with 28 days is clamped to 28."""
        from app.services.prestamos import _calc_proximo_pago

        # Loan started Jan 31, last payment Jan 31 → next should be Feb 28/29
        fecha_inicio = date(2026, 1, 31)
        pagos = [{"fecha": "2026-01-31"}]
        result = _calc_proximo_pago(fecha_inicio, pagos, 3)
        assert result is not None
        assert result.month == 2
        assert result.day <= 28  # Feb max


# ---------------------------------------------------------------------------
# create_prestamo with interest fields
# ---------------------------------------------------------------------------


def test_create_prestamo_with_interest_fields():
    """create_prestamo includes tasa_interes and plazo_meses in insert payload."""
    from app.schemas.prestamo import PrestamoCreate
    from app.services.prestamos import create_prestamo

    inserted_row = {
        "id": "aaaa-9999",
        "user_id": "u1",
        "tipo": "yo_debo",
        "persona": "Banco",
        "monto_original": "10000.00",
        "monto_pendiente": "10000.00",
        "moneda": "DOP",
        "fecha_prestamo": "2026-03-01",
        "fecha_vencimiento": None,
        "descripcion": "Préstamo personal",
        "estado": "activo",
        "notas": None,
        "tasa_interes": "18.5",
        "plazo_meses": 24,
        "created_at": "2026-03-01T00:00:00+00:00",
        "updated_at": "2026-03-01T00:00:00+00:00",
        "deleted_at": None,
    }
    mock_response = MagicMock()
    mock_response.data = [inserted_row]

    mock_client = MagicMock()
    mock_client.table.return_value.insert.return_value.execute.return_value = (
        mock_response
    )

    data = PrestamoCreate(
        tipo="yo_debo",
        persona="Banco",
        monto_original=Decimal("10000.00"),
        fecha_prestamo="2026-03-01",
        tasa_interes=Decimal("18.5"),
        plazo_meses=24,
    )

    with patch("app.services.prestamos.get_user_client", return_value=mock_client):
        result = create_prestamo("fake-jwt", "u1", data)

    insert_payload = mock_client.table.return_value.insert.call_args[0][0]
    assert insert_payload.get("tasa_interes") == "18.5"
    assert insert_payload.get("plazo_meses") == 24
    assert result["id"] == "aaaa-9999"
