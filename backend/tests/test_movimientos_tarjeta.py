"""
Tests for tarjeta movements service and routes.

Coverage:
- Auth guards on all new endpoints
- Schema validation for MovimientoTarjetaCreate
- Service unit tests with mocked supabase client
- Amortization table generation (pure function)
"""
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ---------------------------------------------------------------------------
# Auth guard tests — no token -> 403
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_registrar_movimiento_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/tarjetas/00000000-0000-0000-0000-000000000001/movimientos",
        json={"tipo": "compra", "monto": 500, "fecha": "2026-03-18"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_movimientos_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/tarjetas/00000000-0000-0000-0000-000000000001/movimientos"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_delete_movimiento_requires_auth(client: AsyncClient) -> None:
    response = await client.delete(
        "/api/v1/tarjetas/00000000-0000-0000-0000-000000000001"
        "/movimientos/00000000-0000-0000-0000-000000000002"
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_amortizacion_requires_auth(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/prestamos/00000000-0000-0000-0000-000000000001/amortizacion"
    )
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Schema validation — MovimientoTarjetaCreate
# ---------------------------------------------------------------------------


def test_movimiento_create_valid_compra() -> None:
    from app.schemas.tarjeta import MovimientoTarjetaCreate

    m = MovimientoTarjetaCreate(tipo="compra", monto=Decimal("500.00"), fecha=date(2026, 3, 18))
    assert m.tipo == "compra"
    assert m.monto == Decimal("500.00")


def test_movimiento_create_valid_pago() -> None:
    from app.schemas.tarjeta import MovimientoTarjetaCreate

    m = MovimientoTarjetaCreate(tipo="pago", monto=Decimal("1000.00"), fecha=date(2026, 3, 18))
    assert m.tipo == "pago"


def test_movimiento_create_invalid_tipo() -> None:
    from pydantic import ValidationError

    from app.schemas.tarjeta import MovimientoTarjetaCreate

    with pytest.raises(ValidationError):
        MovimientoTarjetaCreate(tipo="retiro", monto=Decimal("100"), fecha=date(2026, 3, 18))


def test_movimiento_create_zero_monto_raises() -> None:
    from pydantic import ValidationError

    from app.schemas.tarjeta import MovimientoTarjetaCreate

    with pytest.raises(ValidationError):
        MovimientoTarjetaCreate(tipo="compra", monto=Decimal("0"), fecha=date(2026, 3, 18))


def test_movimiento_create_negative_monto_raises() -> None:
    from pydantic import ValidationError

    from app.schemas.tarjeta import MovimientoTarjetaCreate

    with pytest.raises(ValidationError):
        MovimientoTarjetaCreate(tipo="compra", monto=Decimal("-50"), fecha=date(2026, 3, 18))


# ---------------------------------------------------------------------------
# Service unit tests — registrar_movimiento
# ---------------------------------------------------------------------------


def test_registrar_movimiento_success() -> None:
    from app.services.movimientos_tarjeta import registrar_movimiento

    expected = {
        "movimiento_id": "mov-001",
        "egreso_id": None,
        "tipo": "compra",
        "monto": 500.0,
    }
    mock_rpc = MagicMock()
    mock_rpc.execute.return_value.data = expected
    mock_client = MagicMock()
    mock_client.rpc.return_value = mock_rpc

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        result = registrar_movimiento(
            user_jwt="jwt",
            user_id="u1",
            tarjeta_id="t1",
            tipo="compra",
            monto=500.0,
            fecha=date(2026, 3, 18),
        )

    assert result["movimiento_id"] == "mov-001"
    assert result["tipo"] == "compra"

    # Verify RPC was called with correct params
    call_kwargs = mock_client.rpc.call_args
    assert call_kwargs[0][0] == "registrar_movimiento_tarjeta"
    params = call_kwargs[0][1]
    assert params["p_tarjeta_id"] == "t1"
    assert params["p_tipo"] == "compra"
    assert params["p_monto"] == 500.0


def test_registrar_movimiento_tarjeta_not_found_raises_404() -> None:
    from app.services.movimientos_tarjeta import registrar_movimiento

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Tarjeta no encontrada o inactiva"}
    )

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            registrar_movimiento("jwt", "u1", "bad-id", "compra", 100.0, date(2026, 3, 18))

    assert exc_info.value.status_code == 404


def test_registrar_movimiento_limite_excedido_raises_400() -> None:
    from app.services.movimientos_tarjeta import registrar_movimiento

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "La compra excede el limite de credito disponible"}
    )

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            registrar_movimiento("jwt", "u1", "t1", "compra", 999999.0, date(2026, 3, 18))

    assert exc_info.value.status_code == 400


def test_registrar_movimiento_saldo_insuficiente_raises_400() -> None:
    from app.services.movimientos_tarjeta import registrar_movimiento

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "Saldo insuficiente en tarjeta de debito"}
    )

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            registrar_movimiento("jwt", "u1", "t1", "compra", 50000.0, date(2026, 3, 18))

    assert exc_info.value.status_code == 400


def test_registrar_movimiento_no_data_raises_500() -> None:
    from app.services.movimientos_tarjeta import registrar_movimiento

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value.data = None

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            registrar_movimiento("jwt", "u1", "t1", "compra", 100.0, date(2026, 3, 18))

    assert exc_info.value.status_code == 500


# ---------------------------------------------------------------------------
# Service unit tests — get_movimientos
# ---------------------------------------------------------------------------


def test_get_movimientos_returns_list() -> None:
    from app.services.movimientos_tarjeta import get_movimientos

    rows = [
        {"id": "m1", "tarjeta_id": "t1", "tipo": "compra", "monto": "500.00"},
        {"id": "m2", "tarjeta_id": "t1", "tipo": "pago", "monto": "300.00"},
    ]
    mock_client = MagicMock()
    # Chain: table.select.eq.eq.is_.order.order.range.execute
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .is_.return_value
        .order.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
        .data
    ) = rows

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        result = get_movimientos("jwt", "u1", "t1")

    assert len(result) == 2
    assert result[0]["id"] == "m1"


def test_get_movimientos_empty_returns_list() -> None:
    from app.services.movimientos_tarjeta import get_movimientos

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .is_.return_value
        .order.return_value
        .order.return_value
        .range.return_value
        .execute.return_value
        .data
    ) = []

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        result = get_movimientos("jwt", "u1", "t1")

    assert result == []


# ---------------------------------------------------------------------------
# Service unit tests — delete_movimiento
# ---------------------------------------------------------------------------


def test_delete_movimiento_success() -> None:
    from app.services.movimientos_tarjeta import delete_movimiento

    mock_response = MagicMock()
    mock_response.data = [{"id": "m1", "deleted_at": "2026-03-18T00:00:00+00:00"}]

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .is_.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        delete_movimiento("jwt", "u1", "t1", "m1")  # should not raise


def test_delete_movimiento_not_found_raises_404() -> None:
    from app.services.movimientos_tarjeta import delete_movimiento

    mock_response = MagicMock()
    mock_response.data = []  # empty = not found

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .update.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .is_.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            delete_movimiento("jwt", "u1", "t1", "nonexistent")

    assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# Amortization table — pure function tests
# ---------------------------------------------------------------------------


class TestGenerarTablaAmortizacion:
    def test_zero_interest_equal_installments(self) -> None:
        from app.services.prestamos import generar_tabla_amortizacion

        tabla = generar_tabla_amortizacion(
            monto_original=12000.0,
            tasa_interes_anual=None,
            plazo_meses=12,
            fecha_inicio=date(2026, 1, 1),
            pagos_registrados=[],
        )

        assert len(tabla) == 12
        # Each capital should be 1000 (12000 / 12)
        assert tabla[0]["capital"] == 1000.0
        assert tabla[0]["interes"] == 0.0
        # Last row balance is 0
        assert tabla[-1]["saldo_restante"] == 0.0

    def test_with_interest_first_row_has_interest(self) -> None:
        from app.services.prestamos import generar_tabla_amortizacion

        tabla = generar_tabla_amortizacion(
            monto_original=10000.0,
            tasa_interes_anual=12.0,  # 1% monthly
            plazo_meses=6,
            fecha_inicio=date(2026, 1, 1),
            pagos_registrados=[],
        )

        assert len(tabla) == 6
        # Monthly rate = 1%, so first interest = 10000 * 0.01 = 100
        assert tabla[0]["interes"] == 100.0
        assert tabla[0]["capital"] > 0

    def test_balance_reaches_zero_at_end(self) -> None:
        from app.services.prestamos import generar_tabla_amortizacion

        tabla = generar_tabla_amortizacion(
            monto_original=5000.0,
            tasa_interes_anual=24.0,
            plazo_meses=12,
            fecha_inicio=date(2026, 1, 15),
            pagos_registrados=[],
        )

        assert tabla[-1]["saldo_restante"] == 0.0

    def test_paid_installment_marked_when_pago_registrado(self) -> None:
        from app.services.prestamos import generar_tabla_amortizacion

        pago = {
            "numero_cuota": 1,
            "monto": 1000.0,
            "monto_capital": 900.0,
            "monto_interes": 100.0,
            "fecha": "2026-02-01",
        }
        tabla = generar_tabla_amortizacion(
            monto_original=10000.0,
            tasa_interes_anual=12.0,
            plazo_meses=6,
            fecha_inicio=date(2026, 1, 1),
            pagos_registrados=[pago],
        )

        assert tabla[0]["pagado"] is True
        assert tabla[0]["pago_real"]["capital"] == 900.0
        assert tabla[0]["pago_real"]["interes"] == 100.0
        # Row 2 onwards not paid
        assert tabla[1]["pagado"] is False
        assert tabla[1]["pago_real"] is None

    def test_empty_plazo_returns_empty_list(self) -> None:
        from app.services.prestamos import generar_tabla_amortizacion

        result = generar_tabla_amortizacion(
            monto_original=10000.0,
            tasa_interes_anual=None,
            plazo_meses=0,
            fecha_inicio=date(2026, 1, 1),
            pagos_registrados=[],
        )
        assert result == []

    def test_fecha_estimada_advances_month_correctly(self) -> None:
        from app.services.prestamos import generar_tabla_amortizacion

        tabla = generar_tabla_amortizacion(
            monto_original=3000.0,
            tasa_interes_anual=None,
            plazo_meses=3,
            fecha_inicio=date(2026, 1, 10),
            pagos_registrados=[],
        )

        assert tabla[0]["fecha_estimada"] == "2026-02-10"
        assert tabla[1]["fecha_estimada"] == "2026-03-10"
        assert tabla[2]["fecha_estimada"] == "2026-04-10"

    def test_end_of_month_day_clamped(self) -> None:
        """fecha_inicio day=31 should clamp to valid days in shorter months."""
        from app.services.prestamos import generar_tabla_amortizacion

        tabla = generar_tabla_amortizacion(
            monto_original=2000.0,
            tasa_interes_anual=None,
            plazo_meses=2,
            fecha_inicio=date(2026, 1, 31),
            pagos_registrados=[],
        )

        # February 31 doesn't exist, should clamp to Feb 28 (2026 is not leap)
        assert tabla[0]["fecha_estimada"] == "2026-02-28"
        # March 31 exists
        assert tabla[1]["fecha_estimada"] == "2026-03-31"


# ---------------------------------------------------------------------------
# Schema — PagoPrestamoResponse now includes amortization fields
# ---------------------------------------------------------------------------


def test_pago_prestamo_response_accepts_amortization_fields() -> None:
    from datetime import datetime

    from app.schemas.prestamo import PagoPrestamoResponse

    pago = PagoPrestamoResponse(
        id="00000000-0000-0000-0000-000000000001",
        prestamo_id="00000000-0000-0000-0000-000000000002",
        user_id="00000000-0000-0000-0000-000000000003",
        monto=Decimal("1500.00"),
        fecha=date(2026, 3, 18),
        notas=None,
        created_at=datetime(2026, 3, 18, 12, 0, 0),
        monto_capital=Decimal("1300.00"),
        monto_interes=Decimal("200.00"),
        numero_cuota=3,
    )

    assert pago.monto_capital == Decimal("1300.00")
    assert pago.monto_interes == Decimal("200.00")
    assert pago.numero_cuota == 3


def test_pago_prestamo_response_optional_amortization_fields_default_none() -> None:
    from datetime import datetime

    from app.schemas.prestamo import PagoPrestamoResponse

    pago = PagoPrestamoResponse(
        id="00000000-0000-0000-0000-000000000001",
        prestamo_id="00000000-0000-0000-0000-000000000002",
        user_id="00000000-0000-0000-0000-000000000003",
        monto=Decimal("1000.00"),
        fecha=date(2026, 3, 18),
        notas=None,
        created_at=datetime(2026, 3, 18, 12, 0, 0),
    )

    assert pago.monto_capital is None
    assert pago.monto_interes is None
    assert pago.numero_cuota is None


# ---------------------------------------------------------------------------
# Schema — EgresoResponse now includes traceability fields
# ---------------------------------------------------------------------------


def test_egreso_response_accepts_tarjeta_id() -> None:
    from app.schemas.egreso import EgresoResponse

    egreso = EgresoResponse(
        id="00000000-0000-0000-0000-000000000001",
        categoria_id="00000000-0000-0000-0000-000000000002",
        subcategoria_id=None,
        monto=Decimal("500.00"),
        moneda="DOP",
        descripcion="Compra supermercado",
        metodo_pago="tarjeta",
        fecha=date(2026, 3, 18),
        notas=None,
        tarjeta_id="00000000-0000-0000-0000-000000000003",
    )

    assert str(egreso.tarjeta_id) == "00000000-0000-0000-0000-000000000003"
    assert egreso.pago_prestamo_id is None


def test_egreso_response_accepts_pago_prestamo_id() -> None:
    from app.schemas.egreso import EgresoResponse

    egreso = EgresoResponse(
        id="00000000-0000-0000-0000-000000000001",
        categoria_id="00000000-0000-0000-0000-000000000002",
        subcategoria_id=None,
        monto=Decimal("1500.00"),
        moneda="DOP",
        descripcion="Pago prestamo: Juan",
        metodo_pago="transferencia",
        fecha=date(2026, 3, 18),
        notas=None,
        pago_prestamo_id="00000000-0000-0000-0000-000000000004",
    )

    assert str(egreso.pago_prestamo_id) == "00000000-0000-0000-0000-000000000004"
    assert egreso.tarjeta_id is None


def test_egreso_create_accepts_tarjeta_id() -> None:
    from app.schemas.egreso import EgresoCreate

    egreso = EgresoCreate(
        categoria_id="00000000-0000-0000-0000-000000000002",
        monto=Decimal("300.00"),
        fecha=date(2026, 3, 18),
        metodo_pago="tarjeta",
        tarjeta_id="00000000-0000-0000-0000-000000000003",
    )

    assert str(egreso.tarjeta_id) == "00000000-0000-0000-0000-000000000003"


def test_egreso_create_tarjeta_id_defaults_none() -> None:
    from app.schemas.egreso import EgresoCreate

    egreso = EgresoCreate(
        categoria_id="00000000-0000-0000-0000-000000000002",
        monto=Decimal("300.00"),
        fecha=date(2026, 3, 18),
    )

    assert egreso.tarjeta_id is None
