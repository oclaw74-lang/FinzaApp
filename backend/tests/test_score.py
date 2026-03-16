from unittest.mock import MagicMock, patch

import pytest

from app.services.score import _calc_ahorro, _calc_deuda, get_score


def make_client(data_map: dict) -> MagicMock:
    """Build a mock supabase client that returns data_map[table_name]."""
    client = MagicMock()

    def table_side_effect(table_name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_query = MagicMock()
        mock_query.execute.return_value = MagicMock(data=data_map.get(table_name, []))
        mock_query.eq.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.select.return_value = mock_query
        mock_table.select.return_value = mock_query
        return mock_table

    client.table.side_effect = table_side_effect
    return client


class TestCalcAhorro:
    def test_high_savings_returns_25(self) -> None:
        client = make_client(
            {
                "ingresos": [{"monto": "1000.00"}],
                "egresos": [{"monto": "700.00"}],
            }
        )
        result = _calc_ahorro(client, "user-1", 3, 2026)
        assert result == 25  # 30% >= 20% threshold

    def test_zero_savings_returns_0(self) -> None:
        client = make_client(
            {
                "ingresos": [{"monto": "1000.00"}],
                "egresos": [{"monto": "1000.00"}],
            }
        )
        result = _calc_ahorro(client, "user-1", 3, 2026)
        assert result == 0

    def test_no_income_returns_0(self) -> None:
        client = make_client({"ingresos": [], "egresos": []})
        result = _calc_ahorro(client, "user-1", 3, 2026)
        assert result == 0

    def test_partial_savings_scales_linearly(self) -> None:
        # 10% savings → 10/20 * 25 = 12pts
        client = make_client(
            {
                "ingresos": [{"monto": "1000.00"}],
                "egresos": [{"monto": "900.00"}],
            }
        )
        result = _calc_ahorro(client, "user-1", 3, 2026)
        assert result == 12


class TestCalcDeuda:
    def test_no_debt_returns_25(self) -> None:
        client = make_client({"prestamos": [], "ingresos": [{"monto": "2000.00"}]})
        result = _calc_deuda(client, "user-1")
        assert result == 25

    def test_low_debt_ratio_returns_25(self) -> None:
        client = make_client(
            {
                "prestamos": [{"monto_pendiente": "500.00"}],
                "ingresos": [{"monto": "2000.00"}],
            }
        )
        result = _calc_deuda(client, "user-1")
        assert result == 25  # 25% < 30%

    def test_high_debt_returns_low_score(self) -> None:
        client = make_client(
            {
                "prestamos": [{"monto_pendiente": "5000.00"}],
                "ingresos": [{"monto": "1000.00"}],
            }
        )
        result = _calc_deuda(client, "user-1")
        assert result < 10  # 500% ratio

    def test_no_income_with_debt_returns_0(self) -> None:
        client = make_client(
            {
                "prestamos": [{"monto_pendiente": "1000.00"}],
                "ingresos": [],
            }
        )
        result = _calc_deuda(client, "user-1")
        assert result == 0


class TestGetScore:
    @patch("app.services.score.get_user_client")
    def test_score_structure(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "3000.00"}],
                "egresos": [{"monto": "1000.00", "categoria_id": "cat-1"}],
                "prestamos": [],
                "presupuestos": [],
                "metas_ahorro": [],
            }
        )
        result = get_score("jwt-token", "user-id")

        assert "score" in result
        assert "estado" in result
        assert "breakdown" in result
        assert 0 <= result["score"] <= 100
        assert result["estado"] in ["critico", "en_riesgo", "bueno", "excelente"]
        assert sum(result["breakdown"].values()) == result["score"]

    @patch("app.services.score.get_user_client")
    def test_breakdown_fields(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client({})
        result = get_score("jwt-token", "user-id")
        assert all(k in result["breakdown"] for k in ["ahorro", "presupuesto", "deuda", "emergencia"])

    @patch("app.services.score.get_user_client")
    def test_critico_estado(self, mock_get_client: MagicMock) -> None:
        # No income, high debt → critico
        mock_get_client.return_value = make_client(
            {
                "ingresos": [],
                "egresos": [{"monto": "5000.00", "categoria_id": "cat-1"}],
                "prestamos": [{"monto_pendiente": "10000.00"}],
                "presupuestos": [],
                "metas_ahorro": [],
            }
        )
        result = get_score("jwt-token", "user-id")
        assert result["estado"] == "critico"

    @patch("app.services.score.get_user_client")
    def test_all_breakdown_values_within_range(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "5000.00"}],
                "egresos": [{"monto": "500.00", "mes": "3", "year": "2026", "categoria_id": "c1"}],
                "prestamos": [],
                "presupuestos": [],
                "metas_ahorro": [{"monto_actual": "20000.00"}],
            }
        )
        result = get_score("jwt-token", "user-id")
        for key, val in result["breakdown"].items():
            assert 0 <= val <= 25, f"{key} = {val} out of range"
