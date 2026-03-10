"""
Tests for GET /api/v1/dashboard/v2 (Dashboard V2 endpoint).

Coverage:
- Auth guard (no token → 403)
- Response structure (all required fields present)
- With explicit mes/year query params
- Empty data (new user → zeros, empty lists)
- tasa_ahorro zero-division guard (ingresos == 0)
- variacion_pct zero-division guard (previous month totals == 0)
- Resumen financiero calculations
- Metas activas mapping
- Prestamos activos aggregation and proximo_vencimiento
- Egresos por categoria aggregation and percentages
- Ultimas transacciones sorted by fecha DESC, limited to 5
- Presupuestos estado uses egresos data (no extra queries)
- APIError from supabase translates to HTTP 500
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from postgrest import APIError


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_ingreso(
    id: str = "ing-001",
    monto: str = "5000.00",
    descripcion: str = "Salario",
    fecha: str = "2026-03-15",
    categoria_id: str = "cat-ing-001",
    categoria_nombre: str = "Salario",
) -> dict:
    return {
        "id": id,
        "monto": monto,
        "descripcion": descripcion,
        "fecha": fecha,
        "categoria_id": categoria_id,
        "categorias": {"nombre": categoria_nombre},
    }


def _make_egreso(
    id: str = "egr-001",
    monto: str = "2000.00",
    descripcion: str = "Supermercado",
    fecha: str = "2026-03-10",
    categoria_id: str = "cat-egr-001",
    categoria_nombre: str = "Alimentacion",
) -> dict:
    return {
        "id": id,
        "monto": monto,
        "descripcion": descripcion,
        "fecha": fecha,
        "categoria_id": categoria_id,
        "categorias": {"nombre": categoria_nombre},
    }


def _make_presupuesto(
    id: str = "pres-001",
    categoria_id: str = "cat-egr-001",
    categoria_nombre: str = "Alimentacion",
    mes: int = 3,
    year: int = 2026,
    monto_limite: str = "5000.00",
) -> dict:
    return {
        "id": id,
        "categoria_id": categoria_id,
        "categorias": {"nombre": categoria_nombre},
        "mes": mes,
        "year": year,
        "monto_limite": monto_limite,
    }


def _make_meta(
    nombre: str = "Vacaciones",
    monto_objetivo: str = "50000.00",
    monto_actual: str = "10000.00",
    fecha_objetivo: str | None = "2026-12-01",
    estado: str = "activa",
) -> dict:
    return {
        "nombre": nombre,
        "monto_objetivo": monto_objetivo,
        "monto_actual": monto_actual,
        "fecha_objetivo": fecha_objetivo,
        "estado": estado,
    }


def _make_prestamo(
    monto_pendiente: str = "10000.00",
    fecha_vencimiento: str | None = "2026-06-01",
    estado: str = "activo",
) -> dict:
    return {
        "monto_pendiente": monto_pendiente,
        "fecha_vencimiento": fecha_vencimiento,
        "estado": estado,
    }


def _build_v2_mock_client(
    ingresos_data: list,
    egresos_data: list,
    ingresos_ant_data: list | None = None,
    egresos_ant_data: list | None = None,
    presupuestos_data: list | None = None,
    metas_data: list | None = None,
    prestamos_data: list | None = None,
) -> MagicMock:
    """
    Build a MagicMock supabase client for dashboard_v2.

    The service makes sequential calls to: ingresos (mes actual), egresos (mes actual),
    ingresos (mes anterior), egresos (mes anterior), presupuestos, metas_ahorro, prestamos.

    We track call order via a counter on the 'ingresos' and 'egresos' tables so the
    mock returns current-month data first, then previous-month data second.
    """
    if ingresos_ant_data is None:
        ingresos_ant_data = []
    if egresos_ant_data is None:
        egresos_ant_data = []
    if presupuestos_data is None:
        presupuestos_data = []
    if metas_data is None:
        metas_data = []
    if prestamos_data is None:
        prestamos_data = []

    # call counters per table to differentiate current vs previous month
    call_counts: dict[str, int] = {"ingresos": 0, "egresos": 0}

    mock_client = MagicMock()

    def table_side_effect(table_name: str):
        mock_table = MagicMock()

        if table_name == "ingresos":
            call_counts["ingresos"] += 1
            if call_counts["ingresos"] == 1:
                data = ingresos_data
            else:
                data = ingresos_ant_data

            resp = MagicMock()
            resp.data = data

            # Full chain: .select().eq().is_().gte().lte().execute()
            (mock_table
             .select.return_value
             .eq.return_value
             .is_.return_value
             .gte.return_value
             .lte.return_value
             .execute.return_value) = resp

        elif table_name == "egresos":
            call_counts["egresos"] += 1
            if call_counts["egresos"] == 1:
                data = egresos_data
            else:
                data = egresos_ant_data

            resp = MagicMock()
            resp.data = data

            (mock_table
             .select.return_value
             .eq.return_value
             .is_.return_value
             .gte.return_value
             .lte.return_value
             .execute.return_value) = resp

        elif table_name == "presupuestos":
            resp = MagicMock()
            resp.data = presupuestos_data

            # Chain: .select().eq().eq().execute()
            (mock_table
             .select.return_value
             .eq.return_value
             .eq.return_value
             .execute.return_value) = resp

        elif table_name == "metas_ahorro":
            resp = MagicMock()
            resp.data = metas_data

            # Chain: .select().neq().execute()
            (mock_table
             .select.return_value
             .neq.return_value
             .execute.return_value) = resp

        elif table_name == "prestamos":
            resp = MagicMock()
            resp.data = prestamos_data

            # Chain: .select().eq().eq().is_().execute()
            (mock_table
             .select.return_value
             .eq.return_value
             .eq.return_value
             .is_.return_value
             .execute.return_value) = resp

        else:
            resp = MagicMock()
            resp.data = []
            mock_table.select.return_value.execute.return_value = resp

        return mock_table

    mock_client.table.side_effect = table_side_effect
    return mock_client


# ---------------------------------------------------------------------------
# Auth guard tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_dashboard_v2_requires_auth(client: AsyncClient) -> None:
    """GET /dashboard/v2 without a Bearer token must return 403."""
    response = await client.get("/api/v1/dashboard/v2")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Response structure tests
# ---------------------------------------------------------------------------


def test_dashboard_v2_response_structure_all_fields_present() -> None:
    """All top-level and nested fields must be present in the response."""
    from app.services.dashboard_service import get_dashboard_v2

    mock_client = _build_v2_mock_client(
        ingresos_data=[_make_ingreso()],
        egresos_data=[_make_egreso()],
        presupuestos_data=[_make_presupuesto()],
        metas_data=[_make_meta()],
        prestamos_data=[_make_prestamo()],
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    assert "resumen_financiero" in result
    rf = result["resumen_financiero"]
    assert "ingresos_mes" in rf
    assert "egresos_mes" in rf
    assert "balance_mes" in rf
    assert "tasa_ahorro" in rf
    assert "ingresos_mes_anterior" in rf
    assert "egresos_mes_anterior" in rf
    assert "variacion_ingresos_pct" in rf
    assert "variacion_egresos_pct" in rf

    assert "presupuestos_estado" in result
    assert isinstance(result["presupuestos_estado"], list)

    assert "metas_activas" in result
    assert isinstance(result["metas_activas"], list)

    assert "prestamos_activos" in result
    pa = result["prestamos_activos"]
    assert "total_deuda" in pa
    assert "count" in pa
    assert "proximo_vencimiento" in pa

    assert "ultimas_transacciones" in result
    assert isinstance(result["ultimas_transacciones"], list)

    assert "egresos_por_categoria" in result
    assert isinstance(result["egresos_por_categoria"], list)


# ---------------------------------------------------------------------------
# Query params mes/year
# ---------------------------------------------------------------------------


def test_dashboard_v2_with_explicit_mes_year() -> None:
    """Passing mes=1, year=2025 should query January 2025 without error."""
    from app.services.dashboard_service import get_dashboard_v2

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[],
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=1, year=2025)

    rf = result["resumen_financiero"]
    assert rf["ingresos_mes"] == 0.0
    assert rf["egresos_mes"] == 0.0


# ---------------------------------------------------------------------------
# Empty data (new user)
# ---------------------------------------------------------------------------


def test_dashboard_v2_empty_data_returns_zeros_and_empty_lists() -> None:
    """A user with no data should get zero totals and empty collections."""
    from app.services.dashboard_service import get_dashboard_v2

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[],
        ingresos_ant_data=[],
        egresos_ant_data=[],
        presupuestos_data=[],
        metas_data=[],
        prestamos_data=[],
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    rf = result["resumen_financiero"]
    assert rf["ingresos_mes"] == 0.0
    assert rf["egresos_mes"] == 0.0
    assert rf["balance_mes"] == 0.0
    assert rf["tasa_ahorro"] == 0.0
    assert rf["ingresos_mes_anterior"] == 0.0
    assert rf["egresos_mes_anterior"] == 0.0
    assert rf["variacion_ingresos_pct"] == 0.0
    assert rf["variacion_egresos_pct"] == 0.0

    assert result["presupuestos_estado"] == []
    assert result["metas_activas"] == []
    assert result["ultimas_transacciones"] == []
    assert result["egresos_por_categoria"] == []

    pa = result["prestamos_activos"]
    assert pa["total_deuda"] == 0.0
    assert pa["count"] == 0
    assert pa["proximo_vencimiento"] is None


# ---------------------------------------------------------------------------
# Zero-division guards
# ---------------------------------------------------------------------------


def test_dashboard_v2_tasa_ahorro_zero_when_ingresos_zero() -> None:
    """tasa_ahorro must be 0.0 when ingresos_mes == 0 (no division by zero)."""
    from app.services.dashboard_service import get_dashboard_v2

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[_make_egreso(monto="3000.00")],
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    assert result["resumen_financiero"]["tasa_ahorro"] == 0.0


def test_dashboard_v2_variacion_pct_zero_when_prev_month_is_zero() -> None:
    """variacion_*_pct must be 0.0 when previous month totals are zero."""
    from app.services.dashboard_service import get_dashboard_v2

    mock_client = _build_v2_mock_client(
        ingresos_data=[_make_ingreso(monto="10000.00")],
        egresos_data=[_make_egreso(monto="5000.00")],
        ingresos_ant_data=[],
        egresos_ant_data=[],
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    rf = result["resumen_financiero"]
    assert rf["variacion_ingresos_pct"] == 0.0
    assert rf["variacion_egresos_pct"] == 0.0


# ---------------------------------------------------------------------------
# Resumen financiero calculations
# ---------------------------------------------------------------------------


def test_dashboard_v2_resumen_financiero_calculations() -> None:
    """Verify exact numerical calculations for resumen financiero."""
    from app.services.dashboard_service import get_dashboard_v2

    ingresos = [
        _make_ingreso(id="ing-001", monto="40000.00"),
        _make_ingreso(id="ing-002", monto="10000.00"),
    ]
    egresos = [
        _make_egreso(id="egr-001", monto="20000.00"),
        _make_egreso(id="egr-002", monto="5000.00"),
    ]
    # Previous month: 30000 ingresos, 15000 egresos
    ingresos_ant = [_make_ingreso(id="ing-ant-001", monto="30000.00")]
    egresos_ant = [_make_egreso(id="egr-ant-001", monto="15000.00")]

    mock_client = _build_v2_mock_client(
        ingresos_data=ingresos,
        egresos_data=egresos,
        ingresos_ant_data=ingresos_ant,
        egresos_ant_data=egresos_ant,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    rf = result["resumen_financiero"]
    assert rf["ingresos_mes"] == pytest.approx(50000.0)
    assert rf["egresos_mes"] == pytest.approx(25000.0)
    assert rf["balance_mes"] == pytest.approx(25000.0)
    # tasa_ahorro = (25000 / 50000) * 100 = 50.0
    assert rf["tasa_ahorro"] == pytest.approx(50.0)
    assert rf["ingresos_mes_anterior"] == pytest.approx(30000.0)
    assert rf["egresos_mes_anterior"] == pytest.approx(15000.0)
    # variacion_ingresos = (50000 - 30000) / 30000 * 100 = 66.67
    assert rf["variacion_ingresos_pct"] == pytest.approx(66.67, rel=1e-2)
    # variacion_egresos = (25000 - 15000) / 15000 * 100 = 66.67
    assert rf["variacion_egresos_pct"] == pytest.approx(66.67, rel=1e-2)


# ---------------------------------------------------------------------------
# Metas activas
# ---------------------------------------------------------------------------


def test_dashboard_v2_metas_activas_mapping() -> None:
    """Metas activas must map correctly from raw supabase data."""
    from app.services.dashboard_service import get_dashboard_v2

    metas = [
        _make_meta(
            nombre="Vacaciones",
            monto_objetivo="50000.00",
            monto_actual="25000.00",
            fecha_objetivo="2026-12-01",
        ),
        _make_meta(
            nombre="Fondo emergencia",
            monto_objetivo="100000.00",
            monto_actual="0.00",
            fecha_objetivo=None,
        ),
    ]

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[],
        metas_data=metas,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    metas_result = result["metas_activas"]
    assert len(metas_result) == 2

    vacaciones = metas_result[0]
    assert vacaciones["nombre"] == "Vacaciones"
    assert vacaciones["monto_objetivo"] == pytest.approx(50000.0)
    assert vacaciones["monto_actual"] == pytest.approx(25000.0)
    assert vacaciones["porcentaje_completado"] == pytest.approx(50.0)
    assert vacaciones["fecha_limite"] == "2026-12-01"

    fondo = metas_result[1]
    assert fondo["fecha_limite"] is None
    assert fondo["porcentaje_completado"] == 0.0


# ---------------------------------------------------------------------------
# Prestamos activos
# ---------------------------------------------------------------------------


def test_dashboard_v2_prestamos_activos_aggregation() -> None:
    """total_deuda = sum of monto_pendiente, proximo_vencimiento = earliest date."""
    from app.services.dashboard_service import get_dashboard_v2

    prestamos = [
        _make_prestamo(monto_pendiente="10000.00", fecha_vencimiento="2026-09-01"),
        _make_prestamo(monto_pendiente="5000.00", fecha_vencimiento="2026-06-15"),
        _make_prestamo(monto_pendiente="3000.00", fecha_vencimiento=None),
    ]

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[],
        prestamos_data=prestamos,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    pa = result["prestamos_activos"]
    assert pa["total_deuda"] == pytest.approx(18000.0)
    assert pa["count"] == 3
    assert pa["proximo_vencimiento"] == "2026-06-15"


def test_dashboard_v2_prestamos_sin_vencimiento() -> None:
    """When no prestamo has fecha_vencimiento, proximo_vencimiento must be None."""
    from app.services.dashboard_service import get_dashboard_v2

    prestamos = [_make_prestamo(monto_pendiente="5000.00", fecha_vencimiento=None)]

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[],
        prestamos_data=prestamos,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    assert result["prestamos_activos"]["proximo_vencimiento"] is None


# ---------------------------------------------------------------------------
# Egresos por categoria
# ---------------------------------------------------------------------------


def test_dashboard_v2_egresos_por_categoria_sorted_desc() -> None:
    """egresos_por_categoria must be sorted by total descending with correct percentages."""
    from app.services.dashboard_service import get_dashboard_v2

    egresos = [
        _make_egreso(id="egr-001", monto="5000.00", categoria_id="cat-a", categoria_nombre="Alimentacion"),
        _make_egreso(id="egr-002", monto="3000.00", categoria_id="cat-b", categoria_nombre="Transporte"),
        _make_egreso(id="egr-003", monto="2000.00", categoria_id="cat-a", categoria_nombre="Alimentacion"),
    ]

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=egresos,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    cats = result["egresos_por_categoria"]
    assert len(cats) == 2

    # Alimentacion: 7000 / 10000 = 70%
    assert cats[0]["categoria"] == "Alimentacion"
    assert cats[0]["total"] == pytest.approx(7000.0)
    assert cats[0]["porcentaje"] == pytest.approx(70.0)

    # Transporte: 3000 / 10000 = 30%
    assert cats[1]["categoria"] == "Transporte"
    assert cats[1]["total"] == pytest.approx(3000.0)
    assert cats[1]["porcentaje"] == pytest.approx(30.0)


# ---------------------------------------------------------------------------
# Ultimas transacciones
# ---------------------------------------------------------------------------


def test_dashboard_v2_ultimas_transacciones_sorted_by_fecha_desc_limited_5() -> None:
    """ultimas_transacciones must be sorted fecha DESC and limited to 5 items."""
    from app.services.dashboard_service import get_dashboard_v2

    ingresos = [
        _make_ingreso(id="ing-001", fecha="2026-03-01", monto="1000.00"),
        _make_ingreso(id="ing-002", fecha="2026-03-25", monto="2000.00"),
        _make_ingreso(id="ing-003", fecha="2026-03-10", monto="3000.00"),
    ]
    egresos = [
        _make_egreso(id="egr-001", fecha="2026-03-05", monto="500.00"),
        _make_egreso(id="egr-002", fecha="2026-03-20", monto="750.00"),
        _make_egreso(id="egr-003", fecha="2026-03-18", monto="600.00"),
    ]

    mock_client = _build_v2_mock_client(
        ingresos_data=ingresos,
        egresos_data=egresos,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    txs = result["ultimas_transacciones"]
    assert len(txs) == 5

    fechas = [tx["fecha"] for tx in txs]
    assert fechas == sorted(fechas, reverse=True), "Transactions must be sorted by fecha DESC"
    # Most recent must be ing-002 (2026-03-25)
    assert txs[0]["fecha"] == "2026-03-25"
    assert txs[0]["tipo"] == "ingreso"


# ---------------------------------------------------------------------------
# Presupuestos estado
# ---------------------------------------------------------------------------


def test_dashboard_v2_presupuestos_estado_alerta_threshold() -> None:
    """alerta must be True when porcentaje_usado >= 80."""
    from app.services.dashboard_service import get_dashboard_v2

    # Budget: 5000, egreso en misma categoria: 4500 → 90% → alerta True
    presupuestos = [
        _make_presupuesto(categoria_id="cat-egr-001", categoria_nombre="Alimentacion", monto_limite="5000.00"),
    ]
    egresos = [
        _make_egreso(id="egr-001", monto="4500.00", categoria_id="cat-egr-001"),
    ]

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=egresos,
        presupuestos_data=presupuestos,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    presupuestos_result = result["presupuestos_estado"]
    assert len(presupuestos_result) == 1
    p = presupuestos_result[0]
    assert p["categoria"] == "Alimentacion"
    assert p["monto_presupuestado"] == pytest.approx(5000.0)
    assert p["gasto_actual"] == pytest.approx(4500.0)
    assert p["porcentaje_usado"] == pytest.approx(90.0)
    assert p["alerta"] is True


def test_dashboard_v2_presupuestos_estado_no_alerta() -> None:
    """alerta must be False when porcentaje_usado < 80."""
    from app.services.dashboard_service import get_dashboard_v2

    presupuestos = [
        _make_presupuesto(categoria_id="cat-egr-001", monto_limite="10000.00"),
    ]
    egresos = [
        _make_egreso(id="egr-001", monto="2000.00", categoria_id="cat-egr-001"),
    ]

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=egresos,
        presupuestos_data=presupuestos,
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    p = result["presupuestos_estado"][0]
    assert p["porcentaje_usado"] == pytest.approx(20.0)
    assert p["alerta"] is False


# ---------------------------------------------------------------------------
# Previous month boundary: January → December previous year
# ---------------------------------------------------------------------------


def test_dashboard_v2_january_prev_month_is_december_previous_year() -> None:
    """When mes=1, the previous month must be December of the previous year (no error)."""
    from app.services.dashboard_service import get_dashboard_v2, _prev_month

    prev_mes, prev_year = _prev_month(1, 2026)
    assert prev_mes == 12
    assert prev_year == 2025

    mock_client = _build_v2_mock_client(
        ingresos_data=[],
        egresos_data=[],
    )

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard_v2("fake-jwt", "user-001", mes=1, year=2026)

    assert result["resumen_financiero"]["ingresos_mes"] == 0.0


# ---------------------------------------------------------------------------
# APIError handling
# ---------------------------------------------------------------------------


def test_dashboard_v2_api_error_raises_http_500() -> None:
    """A supabase APIError must be translated to HTTPException 500."""
    from app.services.dashboard_service import get_dashboard_v2

    mock_client = MagicMock()
    (mock_client.table.return_value
     .select.return_value
     .eq.return_value
     .is_.return_value
     .gte.return_value
     .lte.return_value
     .execute.side_effect) = APIError({"code": "503", "message": "Service unavailable"})

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        with pytest.raises(HTTPException) as exc_info:
            get_dashboard_v2("fake-jwt", "user-001", mes=3, year=2026)

    assert exc_info.value.status_code == 500
