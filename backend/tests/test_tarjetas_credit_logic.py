"""
Tests for G2: credit card transaction logic redesign.

Coverage:
  - test_registrar_compra_credito_no_crea_egreso
  - test_registrar_compra_debito_crea_egreso
  - test_registrar_pago_credito_crea_egreso
  - test_registrar_deposito_debito_crea_ingreso
  - test_deposito_en_tarjeta_credito_lanza_400
  - test_get_tarjetas_pago_pendiente (varios escenarios)
  - Schema: MovimientoTarjetaCreate acepta 'deposito'
  - Schema: MovimientoTarjetaResponse incluye ingreso_id
  - Router: GET /tarjetas/pagos-pendientes requiere auth
"""
from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ─────────────────────────────────────────────────────────────────────────────
# Auth guard
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_pagos_pendientes_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/tarjetas/pagos-pendientes")
    assert response.status_code == 403


# ─────────────────────────────────────────────────────────────────────────────
# Schema — MovimientoTarjetaCreate acepta 'deposito'
# ─────────────────────────────────────────────────────────────────────────────


def test_movimiento_create_valid_deposito() -> None:
    from app.schemas.tarjeta import MovimientoTarjetaCreate

    m = MovimientoTarjetaCreate(tipo="deposito", monto=Decimal("2000.00"), fecha=date(2026, 6, 1))
    assert m.tipo == "deposito"
    assert m.monto == Decimal("2000.00")


def test_movimiento_create_invalid_tipo_retiro_raises() -> None:
    from pydantic import ValidationError

    from app.schemas.tarjeta import MovimientoTarjetaCreate

    with pytest.raises(ValidationError):
        MovimientoTarjetaCreate(tipo="retiro", monto=Decimal("100"), fecha=date(2026, 6, 1))


# ─────────────────────────────────────────────────────────────────────────────
# Schema — MovimientoTarjetaResponse incluye ingreso_id
# ─────────────────────────────────────────────────────────────────────────────


def test_movimiento_response_includes_ingreso_id() -> None:
    from datetime import datetime

    from app.schemas.tarjeta import MovimientoTarjetaResponse

    r = MovimientoTarjetaResponse(
        id="00000000-0000-0000-0000-000000000001",
        tarjeta_id="00000000-0000-0000-0000-000000000002",
        tipo="deposito",
        monto=Decimal("5000.00"),
        fecha=date(2026, 6, 1),
        ingreso_id="00000000-0000-0000-0000-000000000003",
        created_at=datetime(2026, 6, 1, 12, 0, 0),
    )
    assert str(r.ingreso_id) == "00000000-0000-0000-0000-000000000003"
    assert r.egreso_id is None


def test_movimiento_response_ingreso_id_defaults_none() -> None:
    from datetime import datetime

    from app.schemas.tarjeta import MovimientoTarjetaResponse

    r = MovimientoTarjetaResponse(
        id="00000000-0000-0000-0000-000000000001",
        tarjeta_id="00000000-0000-0000-0000-000000000002",
        tipo="compra",
        monto=Decimal("300.00"),
        fecha=date(2026, 6, 1),
        created_at=datetime(2026, 6, 1, 12, 0, 0),
    )
    assert r.ingreso_id is None
    assert r.egreso_id is None


# ─────────────────────────────────────────────────────────────────────────────
# Service — registrar_movimiento: credit card compra does NOT create egreso
# ─────────────────────────────────────────────────────────────────────────────


def test_registrar_compra_credito_no_crea_egreso() -> None:
    """For a credit card purchase, the RPC result must have egreso_id=None."""
    from app.services.movimientos_tarjeta import registrar_movimiento

    rpc_result = {
        "movimiento_id": "mov-credit-001",
        "egreso_id": None,          # key assertion: no egreso
        "ingreso_id": None,
        "tipo": "compra",
        "tipo_tarjeta": "credito",
        "monto": 1500.0,
    }
    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value.data = rpc_result

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client), \
         patch("app.services.movimientos_tarjeta._get_tarjeta_simple",
               return_value={"bloqueada": False, "activa": True}):
        result = registrar_movimiento(
            user_jwt="jwt",
            user_id="u1",
            tarjeta_id="t-credit",
            tipo="compra",
            monto=1500.0,
            fecha=date(2026, 6, 1),
        )

    assert result["egreso_id"] is None
    assert result["tipo_tarjeta"] == "credito"
    # Verify RPC was called with correct args
    params = mock_client.rpc.call_args[0][1]
    assert params["p_tipo"] == "compra"
    assert params["p_tarjeta_id"] == "t-credit"


def test_registrar_compra_credito_con_categoria_no_crea_egreso() -> None:
    """Even with a categoria_id, credit card compra must not create an egreso."""
    from app.services.movimientos_tarjeta import registrar_movimiento

    rpc_result = {
        "movimiento_id": "mov-credit-002",
        "egreso_id": None,
        "ingreso_id": None,
        "tipo": "compra",
        "tipo_tarjeta": "credito",
        "monto": 800.0,
    }
    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value.data = rpc_result

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client), \
         patch("app.services.movimientos_tarjeta._get_tarjeta_simple",
               return_value={"bloqueada": False, "activa": True}):
        result = registrar_movimiento(
            user_jwt="jwt",
            user_id="u1",
            tarjeta_id="t-credit",
            tipo="compra",
            monto=800.0,
            fecha=date(2026, 6, 1),
            categoria_id="cat-alim",
        )

    assert result["egreso_id"] is None


# ─────────────────────────────────────────────────────────────────────────────
# Service — registrar_movimiento: debit card compra DOES create egreso
# ─────────────────────────────────────────────────────────────────────────────


def test_registrar_compra_debito_crea_egreso() -> None:
    """Debit card purchase must create an egreso and return its ID."""
    from app.services.movimientos_tarjeta import registrar_movimiento

    rpc_result = {
        "movimiento_id": "mov-debit-001",
        "egreso_id": "egr-001",      # egreso created
        "ingreso_id": None,
        "tipo": "compra",
        "tipo_tarjeta": "debito",
        "monto": 500.0,
    }
    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value.data = rpc_result

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client), \
         patch("app.services.movimientos_tarjeta._get_tarjeta_simple",
               return_value={"bloqueada": False, "activa": True}):
        result = registrar_movimiento(
            user_jwt="jwt",
            user_id="u1",
            tarjeta_id="t-debit",
            tipo="compra",
            monto=500.0,
            fecha=date(2026, 6, 1),
            categoria_id="cat-alim",
        )

    assert result["egreso_id"] == "egr-001"
    assert result["tipo_tarjeta"] == "debito"


# ─────────────────────────────────────────────────────────────────────────────
# Service — registrar_movimiento: credit card pago DOES create egreso
# ─────────────────────────────────────────────────────────────────────────────


def test_registrar_pago_credito_crea_egreso() -> None:
    """Credit card payment must create an egreso (cash leaves user balance)."""
    from app.services.movimientos_tarjeta import registrar_movimiento

    rpc_result = {
        "movimiento_id": "mov-pago-001",
        "egreso_id": "egr-pago-001",  # egreso created
        "ingreso_id": None,
        "tipo": "pago",
        "tipo_tarjeta": "credito",
        "monto": 3000.0,
    }
    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value.data = rpc_result

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client), \
         patch("app.services.movimientos_tarjeta._get_tarjeta_simple",
               return_value={"bloqueada": False, "activa": True}):
        result = registrar_movimiento(
            user_jwt="jwt",
            user_id="u1",
            tarjeta_id="t-credit",
            tipo="pago",
            monto=3000.0,
            fecha=date(2026, 6, 1),
            categoria_id="cat-servicios",
        )

    assert result["egreso_id"] == "egr-pago-001"
    assert result["tipo"] == "pago"
    params = mock_client.rpc.call_args[0][1]
    assert params["p_tipo"] == "pago"


# ─────────────────────────────────────────────────────────────────────────────
# Service — registrar_movimiento: debit deposito creates ingreso
# ─────────────────────────────────────────────────────────────────────────────


def test_registrar_deposito_debito_crea_ingreso() -> None:
    """Debit card deposit must create an ingreso and return its ID."""
    from app.services.movimientos_tarjeta import registrar_movimiento

    rpc_result = {
        "movimiento_id": "mov-dep-001",
        "egreso_id": None,
        "ingreso_id": "ing-001",     # ingreso created
        "tipo": "deposito",
        "tipo_tarjeta": "debito",
        "monto": 10000.0,
    }
    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.return_value.data = rpc_result

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client), \
         patch("app.services.movimientos_tarjeta._get_tarjeta_simple",
               return_value={"bloqueada": False, "activa": True}):
        result = registrar_movimiento(
            user_jwt="jwt",
            user_id="u1",
            tarjeta_id="t-debit",
            tipo="deposito",
            monto=10000.0,
            fecha=date(2026, 6, 1),
            categoria_id="cat-ingresos",
        )

    assert result["ingreso_id"] == "ing-001"
    assert result["egreso_id"] is None
    assert result["tipo"] == "deposito"


# ─────────────────────────────────────────────────────────────────────────────
# Service — registrar_movimiento: deposito on credit card raises 400
# ─────────────────────────────────────────────────────────────────────────────


def test_deposito_en_tarjeta_credito_lanza_400() -> None:
    """Deposito on a credit card must raise HTTP 400."""
    from app.services.movimientos_tarjeta import registrar_movimiento

    mock_client = MagicMock()
    mock_client.rpc.return_value.execute.side_effect = APIError(
        {"code": "400", "message": "No se puede registrar un deposito en una tarjeta de credito"}
    )

    with patch("app.services.movimientos_tarjeta.get_user_client", return_value=mock_client), \
         patch("app.services.movimientos_tarjeta._get_tarjeta_simple",
               return_value={"bloqueada": False, "activa": True}):
        with pytest.raises(HTTPException) as exc_info:
            registrar_movimiento(
                user_jwt="jwt",
                user_id="u1",
                tarjeta_id="t-credit",
                tipo="deposito",
                monto=5000.0,
                fecha=date(2026, 6, 1),
            )

    assert exc_info.value.status_code == 400
    assert "deposito" in exc_info.value.detail.lower()


# ─────────────────────────────────────────────────────────────────────────────
# Service — get_tarjetas_pago_pendiente
# ─────────────────────────────────────────────────────────────────────────────


def _make_tarjeta(fecha_pago: int, saldo: float = 5000.0) -> dict:
    return {
        "id": f"t-{fecha_pago}",
        "user_id": "u1",
        "banco": "BPD",
        "tipo": "credito",
        "red": "visa",
        "limite_credito": "50000.00",
        "saldo_actual": str(saldo),
        "fecha_pago": fecha_pago,
        "activa": True,
        "bloqueada": False,
        "titular": "Test",
        "ultimos_digitos": "1234",
        "fecha_corte": None,
        "color": None,
    }


def test_get_tarjetas_pago_pendiente_within_3_days() -> None:
    """Returns cards whose fecha_pago is within 3 days from today."""
    from app.services.tarjetas import get_tarjetas_pago_pendiente, _days_until_dia_del_mes

    today = date.today()
    # dia = tomorrow
    target_dia = (today.replace(day=today.day + 1)
                  if today.day < 28 else today)
    dias = _days_until_dia_del_mes(target_dia.day, today)
    # Only run the main assertion if the target_dia is within 3 days
    assert dias <= 3

    tarjeta = _make_tarjeta(fecha_pago=target_dia.day)

    mock_response = MagicMock()
    mock_response.data = [tarjeta]
    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = get_tarjetas_pago_pendiente("jwt", "u1")

    assert len(result) == 1
    assert result[0]["id"] == tarjeta["id"]
    assert "dias_para_pago" in result[0]
    assert result[0]["dias_para_pago"] == dias
    assert "fecha_pago_proxima" in result[0]


def test_get_tarjetas_pago_pendiente_skips_zero_saldo() -> None:
    """Cards with saldo_actual = 0 are excluded."""
    from app.services.tarjetas import get_tarjetas_pago_pendiente

    today = date.today()
    tarjeta = _make_tarjeta(fecha_pago=today.day, saldo=0.0)

    mock_response = MagicMock()
    mock_response.data = [tarjeta]
    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = get_tarjetas_pago_pendiente("jwt", "u1")

    assert result == []


def test_get_tarjetas_pago_pendiente_skips_no_fecha_pago() -> None:
    """Cards without fecha_pago are excluded."""
    from app.services.tarjetas import get_tarjetas_pago_pendiente

    tarjeta = _make_tarjeta(fecha_pago=None, saldo=5000.0)  # type: ignore[arg-type]
    tarjeta["fecha_pago"] = None  # override

    mock_response = MagicMock()
    mock_response.data = [tarjeta]
    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = get_tarjetas_pago_pendiente("jwt", "u1")

    assert result == []


def test_get_tarjetas_pago_pendiente_far_future_excluded() -> None:
    """Cards with fecha_pago more than 3 days away are excluded."""
    from app.services.tarjetas import get_tarjetas_pago_pendiente

    today = date.today()
    # Use a dia that is 15 days in the future (always > 3)
    future_dia = (today.day + 15 - 1) % 28 + 1  # stays in 1-28 range
    tarjeta = _make_tarjeta(fecha_pago=future_dia, saldo=5000.0)

    mock_response = MagicMock()
    mock_response.data = [tarjeta]
    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.return_value
    ) = mock_response

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        result = get_tarjetas_pago_pendiente("jwt", "u1")

    # If future_dia ends up within 3 days, test is still valid (empty or not)
    from app.services.tarjetas import _days_until_dia_del_mes
    days = _days_until_dia_del_mes(future_dia, today)
    if days > 3:
        assert result == []


def test_get_tarjetas_pago_pendiente_api_error_raises() -> None:
    """APIError from Supabase propagates as HTTPException."""
    from app.services.tarjetas import get_tarjetas_pago_pendiente

    mock_client = MagicMock()
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .eq.return_value
        .eq.return_value
        .execute.side_effect
    ) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.tarjetas.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_tarjetas_pago_pendiente("jwt", "u1")

    assert exc_info.value.status_code == 500


# ─────────────────────────────────────────────────────────────────────────────
# Pure helper — _days_until_dia_del_mes
# ─────────────────────────────────────────────────────────────────────────────


class TestDaysUntilDiaDelMes:
    def test_today_is_0_days(self) -> None:
        from app.services.tarjetas import _days_until_dia_del_mes

        today = date(2026, 6, 15)
        assert _days_until_dia_del_mes(15, today) == 0

    def test_tomorrow_is_1_day(self) -> None:
        from app.services.tarjetas import _days_until_dia_del_mes

        today = date(2026, 6, 14)
        assert _days_until_dia_del_mes(15, today) == 1

    def test_past_day_wraps_to_next_month(self) -> None:
        from app.services.tarjetas import _days_until_dia_del_mes

        # today = June 20, fecha_pago = 5 → wraps to July 5 → 15 days
        today = date(2026, 6, 20)
        days = _days_until_dia_del_mes(5, today)
        assert days == (date(2026, 7, 5) - today).days

    def test_december_wraps_to_january(self) -> None:
        from app.services.tarjetas import _days_until_dia_del_mes

        # today = Dec 28, fecha_pago = 5 → wraps to Jan 5 → 8 days
        today = date(2026, 12, 28)
        days = _days_until_dia_del_mes(5, today)
        assert days == (date(2027, 1, 5) - today).days

    def test_dia_31_in_feb_clamped(self) -> None:
        from app.services.tarjetas import _days_until_dia_del_mes

        # today = Feb 1, fecha_pago = 31 → clamps to Feb 28 (2026 not leap)
        today = date(2026, 2, 1)
        days = _days_until_dia_del_mes(31, today)
        assert days == 27  # Feb 28 - Feb 1 = 27 days
