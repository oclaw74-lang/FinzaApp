from unittest.mock import MagicMock, call, patch

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


def _build_mock_client(ingresos_data: list, egresos_data: list) -> MagicMock:
    """
    Build a MagicMock supabase client that returns different data depending on
    which table is queried. The side_effect on .table() inspects the table name
    and routes to the correct mock response.
    """
    mock_client = MagicMock()

    def table_side_effect(table_name: str):
        mock_table = MagicMock()
        mock_response = MagicMock()

        if table_name == "ingresos":
            mock_response.data = ingresos_data
        elif table_name == "egresos":
            mock_response.data = egresos_data
        else:
            mock_response.data = []

        # Chain: .select().eq().is_().gte().lte().execute() and subsets for trend
        (mock_table
         .select.return_value
         .eq.return_value
         .is_.return_value
         .gte.return_value
         .lte.return_value
         .execute.return_value) = mock_response

        # Also handle the short chain used in _fetch_month_totals (same path)
        return mock_table

    mock_client.table.side_effect = table_side_effect
    return mock_client


# ---------------------------------------------------------------------------
# Auth guard tests
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_dashboard_requires_auth(client: AsyncClient) -> None:
    """GET /dashboard without a Bearer token must return 403."""
    response = await client.get("/api/v1/dashboard")
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# Service unit tests
# ---------------------------------------------------------------------------

def test_dashboard_empty_month():
    """Empty ingresos + egresos → all KPIs are 0.0, empty breakdown/recent."""
    from app.services.dashboard_service import get_dashboard

    mock_client = _build_mock_client(ingresos_data=[], egresos_data=[])

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard("fake-jwt", "user-001", mes=3, year=2026)

    kpis = result["kpis"]
    assert kpis["total_ingresos"] == 0.0
    assert kpis["total_egresos"] == 0.0
    assert kpis["balance"] == 0.0
    assert kpis["ahorro_estimado"] == 0.0
    assert result["categoria_breakdown"] == []
    assert result["recent_transactions"] == []
    assert result["mes"] == 3
    assert result["year"] == 2026


def test_dashboard_with_data():
    """KPIs must correctly aggregate mock ingreso and egreso data."""
    from app.services.dashboard_service import get_dashboard

    ingresos = [
        _make_ingreso(id="ing-001", monto="45000.00", categoria_nombre="Salario"),
        _make_ingreso(id="ing-002", monto="5000.00", categoria_nombre="Freelance", categoria_id="cat-ing-002"),
    ]
    egresos = [
        _make_egreso(id="egr-001", monto="20000.00", categoria_nombre="Alquiler", categoria_id="cat-egr-001"),
        _make_egreso(id="egr-002", monto="10000.00", categoria_nombre="Alimentacion", categoria_id="cat-egr-002"),
    ]

    mock_client = _build_mock_client(ingresos_data=ingresos, egresos_data=egresos)

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard("fake-jwt", "user-001", mes=3, year=2026)

    kpis = result["kpis"]
    assert kpis["total_ingresos"] == pytest.approx(50000.0)
    assert kpis["total_egresos"] == pytest.approx(30000.0)
    assert kpis["balance"] == pytest.approx(20000.0)
    assert kpis["ahorro_estimado"] == pytest.approx(20000.0)

    # Breakdown must have 2 ingreso categories + 2 egreso categories
    tipos_ing = [b for b in result["categoria_breakdown"] if b["tipo"] == "ingreso"]
    tipos_egr = [b for b in result["categoria_breakdown"] if b["tipo"] == "egreso"]
    assert len(tipos_ing) == 2
    assert len(tipos_egr) == 2

    # Highest ingreso category must come first (sorted desc by monto)
    assert tipos_ing[0]["monto"] == pytest.approx(45000.0)
    assert tipos_ing[0]["porcentaje"] == pytest.approx(90.0)
    assert tipos_ing[1]["porcentaje"] == pytest.approx(10.0)

    # recent_transactions should have at most 5 items from combined 4
    assert len(result["recent_transactions"]) == 4

    # Monthly trend must have exactly 6 entries
    assert len(result["monthly_trend"]) == 6
    # Last entry must be the current month
    assert result["monthly_trend"][-1]["mes"] == 3
    assert result["monthly_trend"][-1]["year"] == 2026
    assert result["monthly_trend"][-1]["label"] == "Mar"


def test_dashboard_negative_balance_ahorro_zero():
    """When total_egresos > total_ingresos, ahorro_estimado must be 0.0."""
    from app.services.dashboard_service import get_dashboard

    ingresos = [_make_ingreso(monto="5000.00")]
    egresos = [_make_egreso(monto="8000.00")]

    mock_client = _build_mock_client(ingresos_data=ingresos, egresos_data=egresos)

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard("fake-jwt", "user-001", mes=3, year=2026)

    kpis = result["kpis"]
    assert kpis["balance"] == pytest.approx(-3000.0)
    assert kpis["ahorro_estimado"] == 0.0


def test_dashboard_api_error_raises_http_500():
    """An APIError from supabase must be translated to HTTPException 500."""
    from app.services.dashboard_service import get_dashboard

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
            get_dashboard("fake-jwt", "user-001", mes=3, year=2026)

    assert exc_info.value.status_code == 500


def test_dashboard_recent_transactions_sorted_by_date_desc():
    """recent_transactions must be sorted by fecha descending."""
    from app.services.dashboard_service import get_dashboard

    ingresos = [
        _make_ingreso(id="ing-001", monto="1000.00", fecha="2026-03-01"),
        _make_ingreso(id="ing-002", monto="2000.00", fecha="2026-03-20"),
    ]
    egresos = [
        _make_egreso(id="egr-001", monto="500.00", fecha="2026-03-10"),
    ]

    mock_client = _build_mock_client(ingresos_data=ingresos, egresos_data=egresos)

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard("fake-jwt", "user-001", mes=3, year=2026)

    fechas = [tx["fecha"] for tx in result["recent_transactions"]]
    assert fechas == sorted(fechas, reverse=True), "Transactions must be sorted by fecha DESC"


def test_dashboard_monthly_trend_label_mapping():
    """Monthly trend labels must match the Spanish month abbreviations."""
    from app.services.dashboard_service import get_dashboard, MONTH_LABELS

    mock_client = _build_mock_client(ingresos_data=[], egresos_data=[])

    with patch("app.services.dashboard_service.get_user_client", return_value=mock_client):
        result = get_dashboard("fake-jwt", "user-001", mes=1, year=2026)

    trend = result["monthly_trend"]
    for item in trend:
        expected_label = MONTH_LABELS[item["mes"] - 1]
        assert item["label"] == expected_label
