from unittest.mock import MagicMock, patch

import pytest

from app.services.prediccion import get_prediccion_mes


def make_client(data_map: dict) -> MagicMock:
    client = MagicMock()

    def table_side_effect(table_name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_query = MagicMock()
        mock_query.execute.return_value = MagicMock(data=data_map.get(table_name, []))
        mock_query.eq.return_value = mock_query
        mock_query.select.return_value = mock_query
        mock_table.select.return_value = mock_query
        return mock_table

    client.table.side_effect = table_side_effect
    return client


class TestPrediccionMes:
    @patch("app.services.prediccion.get_user_client")
    def test_response_structure(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "3000.00"}],
                "egresos": [{"monto": "500.00", "categoria_id": "cat-1"}],
                "presupuestos": [{"monto_limite": "1000.00"}],
                "categorias": [{"id": "cat-1", "nombre": "Alimentación"}],
            }
        )
        result = get_prediccion_mes("token", "user-1")

        assert "saldo_proyectado" in result
        assert "saldo_si_presupuesto" in result
        assert "es_negativa" in result
        assert "sugerencia" in result
        assert "dias_restantes" in result
        assert "gasto_diario_promedio" in result
        assert isinstance(result["es_negativa"], bool)
        assert isinstance(result["sugerencia"], str)

    @patch("app.services.prediccion.get_user_client")
    def test_negative_projection_when_spending_exceeds_income(
        self, mock_get_client: MagicMock
    ) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "500.00"}],
                "egresos": [{"monto": "2000.00", "categoria_id": "cat-1"}],
                "presupuestos": [],
                "categorias": [{"id": "cat-1", "nombre": "Varios"}],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["es_negativa"] is True

    @patch("app.services.prediccion.get_user_client")
    def test_no_presupuestos_returns_none(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "2000.00"}],
                "egresos": [],
                "presupuestos": [],
                "categorias": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["saldo_si_presupuesto"] is None

    @patch("app.services.prediccion.get_user_client")
    def test_no_gastos_returns_zero_daily(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "2000.00"}],
                "egresos": [],
                "presupuestos": [],
                "categorias": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["gasto_diario_promedio"] == 0.0
        assert result["categoria_mayor_impacto"] is None

    @patch("app.services.prediccion.get_user_client")
    def test_categoria_mayor_impacto_identified(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "3000.00"}],
                "egresos": [
                    {"monto": "800.00", "categoria_id": "cat-1"},
                    {"monto": "200.00", "categoria_id": "cat-2"},
                ],
                "presupuestos": [],
                "categorias": [
                    {"id": "cat-1", "nombre": "Entretenimiento"},
                    {"id": "cat-2", "nombre": "Transporte"},
                ],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["categoria_mayor_impacto"] is not None
        assert result["categoria_mayor_impacto"]["nombre"] == "Entretenimiento"
        assert result["categoria_mayor_impacto"]["porcentaje_del_total"] == 80.0

    @patch("app.services.prediccion.get_user_client")
    def test_saldo_si_presupuesto_calculated(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "3000.00"}],
                "egresos": [],
                "presupuestos": [
                    {"monto_limite": "500.00"},
                    {"monto_limite": "300.00"},
                ],
                "categorias": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["saldo_si_presupuesto"] == 2200.0  # 3000 - (500+300)
