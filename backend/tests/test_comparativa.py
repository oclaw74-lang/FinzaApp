from unittest.mock import MagicMock, patch

import pytest

from app.services.comparativa import get_comparativa


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client(prestamos_data: list, metas_data: list) -> MagicMock:
    """Build a mock client returning different data per table."""
    client = MagicMock()

    def table_side_effect(name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_q = MagicMock()

        if name == "prestamos":
            mock_q.execute.return_value = MagicMock(data=prestamos_data)
        elif name == "metas_ahorro":
            mock_q.execute.return_value = MagicMock(data=metas_data)
        else:
            mock_q.execute.return_value = MagicMock(data=[])

        mock_q.select.return_value = mock_q
        mock_q.eq.return_value = mock_q
        mock_table.select.return_value = mock_q
        return mock_table

    client.table.side_effect = table_side_effect
    return client


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestGetComparativa:
    @patch("app.services.comparativa.get_user_client")
    def test_response_structure(self, mock_gc: MagicMock) -> None:
        mock_gc.return_value = _make_client([], [])
        result = get_comparativa("token", "user-1")

        assert "deudas" in result
        assert "ahorros" in result
        assert "total_costo_deuda" in result
        assert "total_rendimiento_ahorro" in result
        assert "diferencia" in result
        assert "recomendacion" in result
        assert isinstance(result["recomendacion"], str)

    @patch("app.services.comparativa.get_user_client")
    def test_no_debts_no_savings_zero_totals(self, mock_gc: MagicMock) -> None:
        mock_gc.return_value = _make_client([], [])
        result = get_comparativa("token", "user-1")

        assert result["total_costo_deuda"] == 0.0
        assert result["total_rendimiento_ahorro"] == 0.0
        assert result["diferencia"] == 0.0
        assert result["deudas"] == []
        assert result["ahorros"] == []

    @patch("app.services.comparativa.get_user_client")
    def test_debt_cost_calculated_correctly(self, mock_gc: MagicMock) -> None:
        # 12,000 at 12% annual = 1200/12 = 100/month
        prestamo = {
            "descripcion": "Prestamo auto",
            "persona": "Banco",
            "tasa_interes": "12.00",
            "monto_pendiente": "12000.00",
        }
        mock_gc.return_value = _make_client([prestamo], [])
        result = get_comparativa("token", "user-1")

        assert len(result["deudas"]) == 1
        assert result["deudas"][0]["costo_o_rendimiento_mensual"] == 120.0
        assert result["total_costo_deuda"] == 120.0

    @patch("app.services.comparativa.get_user_client")
    def test_savings_rendimiento_calculated_correctly(self, mock_gc: MagicMock) -> None:
        # 12,000 at 4% annual proxy = 480/12 = 40/month
        meta = {"nombre": "Fondo emergencia", "monto_actual": "12000.00"}
        mock_gc.return_value = _make_client([], [meta])
        result = get_comparativa("token", "user-1")

        assert len(result["ahorros"]) == 1
        assert result["ahorros"][0]["costo_o_rendimiento_mensual"] == 40.0
        assert result["total_rendimiento_ahorro"] == 40.0

    @patch("app.services.comparativa.get_user_client")
    def test_diferencia_positive_when_debt_exceeds_savings(self, mock_gc: MagicMock) -> None:
        prestamo = {"descripcion": "Deuda", "tasa_interes": "24.00", "monto_pendiente": "10000.00"}
        meta = {"nombre": "Meta", "monto_actual": "1000.00"}
        mock_gc.return_value = _make_client([prestamo], [meta])
        result = get_comparativa("token", "user-1")

        assert result["diferencia"] > 0

    @patch("app.services.comparativa.get_user_client")
    def test_recomendacion_is_non_empty_string(self, mock_gc: MagicMock) -> None:
        prestamo = {"descripcion": "Deuda", "tasa_interes": "18.00", "monto_pendiente": "5000.00"}
        mock_gc.return_value = _make_client([prestamo], [])
        result = get_comparativa("token", "user-1")

        assert len(result["recomendacion"]) > 10

    @patch("app.services.comparativa.get_user_client")
    def test_item_tipo_fields_correct(self, mock_gc: MagicMock) -> None:
        prestamo = {"descripcion": "P1", "tasa_interes": "10.00", "monto_pendiente": "1000.00"}
        meta = {"nombre": "M1", "monto_actual": "2000.00"}
        mock_gc.return_value = _make_client([prestamo], [meta])
        result = get_comparativa("token", "user-1")

        assert result["deudas"][0]["tipo"] == "deuda"
        assert result["ahorros"][0]["tipo"] == "ahorro"
