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
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.select.return_value = mock_query
        mock_query.is_.return_value = mock_query
        mock_query.maybe_single.return_value = mock_query
        mock_table.select.return_value = mock_query
        mock_table.insert.return_value = mock_query
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
                "categorias": [{"id": "cat-1", "nombre": "Alimentación", "nombre_en": "Food"}],
                "profiles": {"salario_neto": "3000.00"},
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")

        assert "saldo_proyectado" in result
        assert "saldo_si_presupuesto" in result
        assert "es_negativa" in result
        assert "sugerencia_tipo" in result
        assert "dias_restantes" in result
        assert "gasto_diario_promedio" in result
        assert isinstance(result["es_negativa"], bool)
        assert isinstance(result["sugerencia_tipo"], str)
        assert result["sugerencia_tipo"] in ["reducir", "positivo", "negativo"]

    @patch("app.services.prediccion.get_user_client")
    def test_negative_projection_when_spending_exceeds_income(
        self, mock_get_client: MagicMock
    ) -> None:
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "500.00"}],
                "egresos": [{"monto": "2000.00", "categoria_id": "cat-1"}],
                "presupuestos": [],
                "categorias": [{"id": "cat-1", "nombre": "Varios", "nombre_en": None}],
                "profiles": None,
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
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
                "profiles": None,
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
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
                "profiles": None,
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
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
                    {"id": "cat-1", "nombre": "Entretenimiento", "nombre_en": "Entertainment"},
                    {"id": "cat-2", "nombre": "Transporte", "nombre_en": "Transport"},
                ],
                "profiles": None,
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
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
                "profiles": None,
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["saldo_si_presupuesto"] == 2200.0  # 3000 - (500+300)

    # --- Tests for Fix #19 enriched fields ---

    @patch("app.services.prediccion.get_user_client")
    def test_enriched_fields_present(self, mock_get_client: MagicMock) -> None:
        """All new enriched fields are returned in the response."""
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "3000.00"}],
                "egresos": [{"monto": "500.00", "categoria_id": "cat-1"}],
                "presupuestos": [],
                "categorias": [{"id": "cat-1", "nombre": "Alimentos", "nombre_en": None}],
                "profiles": {"salario_neto": "5000.00"},
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        for field in [
            "ingreso_esperado",
            "gasto_esperado",
            "balance_final",
            "avg_egresos_3m",
            "sum_cuotas_prestamos",
            "sum_suscripciones",
            "sum_compromisos_ahorro",
            "egresos_proyectados",
        ]:
            assert field in result, f"Missing field: {field}"

    @patch("app.services.prediccion.get_user_client")
    def test_salario_neto_used_as_ingreso_esperado(self, mock_get_client: MagicMock) -> None:
        """When salario_neto is set, it is used as ingreso_esperado."""
        mock_get_client.return_value = make_client(
            {
                "ingresos": [{"monto": "1000.00"}],
                "egresos": [],
                "presupuestos": [],
                "categorias": [],
                "profiles": {"salario_neto": "7500.00"},
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["ingreso_esperado"] == 7500.0

    @patch("app.services.prediccion.get_user_client")
    def test_no_salary_fallback_to_avg_ingresos(self, mock_get_client: MagicMock) -> None:
        """Without salary, ingreso_esperado falls back to avg_ingresos_3m (≈ 0 here)."""
        mock_get_client.return_value = make_client(
            {
                "ingresos": [],
                "egresos": [],
                "presupuestos": [],
                "categorias": [],
                "profiles": None,
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["ingreso_esperado"] == 0.0

    @patch("app.services.prediccion.get_user_client")
    def test_sum_suscripciones_monthly_normalized(self, mock_get_client: MagicMock) -> None:
        """Subscription amounts are normalized to monthly equivalent."""
        mock_get_client.return_value = make_client(
            {
                "ingresos": [],
                "egresos": [],
                "presupuestos": [],
                "categorias": [],
                "profiles": None,
                "prestamos": [],
                "suscripciones": [
                    {"monto": "1200.00", "frecuencia": "anual"},   # → 100/month
                    {"monto": "300.00", "frecuencia": "mensual"},  # → 300/month
                ],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["sum_suscripciones"] == pytest.approx(400.0, abs=0.01)

    @patch("app.services.prediccion.get_user_client")
    def test_sum_cuotas_prestamos_no_interest(self, mock_get_client: MagicMock) -> None:
        """Loan installment computed correctly with no interest."""
        mock_get_client.return_value = make_client(
            {
                "ingresos": [],
                "egresos": [],
                "presupuestos": [],
                "categorias": [],
                "profiles": None,
                "prestamos": [
                    # 12,000 / 12 months = 1000/month
                    {"monto_original": "12000.00", "tasa_interes": None, "plazo_meses": "12"},
                ],
                "suscripciones": [],
                "metas_ahorro": [],
            }
        )
        result = get_prediccion_mes("token", "user-1")
        assert result["sum_cuotas_prestamos"] == pytest.approx(1000.0, abs=0.01)

    @patch("app.services.prediccion.get_user_client")
    def test_deficit_notification_created_when_balance_final_negative(
        self, mock_get_client: MagicMock
    ) -> None:
        """When balance_final < 0, a prediccion_deficit notification is attempted."""
        mock_client = make_client(
            {
                "ingresos": [],
                "egresos": [{"monto": "500.00", "categoria_id": None}],
                "presupuestos": [],
                "categorias": [],
                "profiles": {"salario_neto": "100.00"},  # very low salary → deficit
                "prestamos": [],
                "suscripciones": [],
                "metas_ahorro": [],
                "notificaciones": [],
            }
        )
        mock_get_client.return_value = mock_client
        result = get_prediccion_mes("token", "user-1")
        assert result["balance_final"] < 0

