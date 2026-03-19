from datetime import date, timedelta
from unittest.mock import MagicMock, patch

import pytest

from app.services.notificaciones import (
    eliminar_notificacion,
    get_notificaciones,
    marcar_leida,
    marcar_todas_leidas,
)


def make_client(data_map: dict) -> MagicMock:
    client = MagicMock()

    def table_side_effect(table_name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_query = MagicMock()
        mock_query.execute.return_value = MagicMock(data=data_map.get(table_name, []))
        mock_query.eq.return_value = mock_query
        mock_query.select.return_value = mock_query
        mock_query.update.return_value = mock_query
        mock_query.delete.return_value = mock_query
        mock_query.insert.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_table.select.return_value = mock_query
        mock_table.update.return_value = mock_query
        mock_table.delete.return_value = mock_query
        mock_table.insert.return_value = mock_query
        return mock_table

    client.table.side_effect = table_side_effect
    return client


SAMPLE_NOTIF = {
    "id": "notif-1",
    "tipo": "urgente",
    "categoria": "presupuesto",
    "titulo": "Test notification",
    "mensaje": "Test message body",
    "leida": False,
    "created_at": "2026-03-11T10:00:00+00:00",
}


class TestGetNotificaciones:
    @patch("app.services.notificaciones.get_user_client")
    def test_returns_list_of_notifications(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client({"notificaciones": [SAMPLE_NOTIF]})
        result = get_notificaciones("token", "user-1")
        assert isinstance(result, list)
        assert len(result) == 1

    @patch("app.services.notificaciones.get_user_client")
    def test_empty_when_no_notifications(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client({"notificaciones": []})
        result = get_notificaciones("token", "user-1")
        assert result == []

    @patch("app.services.notificaciones.get_user_client")
    def test_solo_no_leidas_flag_passed(self, mock_get_client: MagicMock) -> None:
        mock_client = make_client({"notificaciones": [SAMPLE_NOTIF]})
        mock_get_client.return_value = mock_client
        result = get_notificaciones("token", "user-1", solo_no_leidas=True)
        assert isinstance(result, list)


class TestMarcarLeida:
    @patch("app.services.notificaciones.get_user_client")
    def test_marks_notification_as_read(self, mock_get_client: MagicMock) -> None:
        updated = {**SAMPLE_NOTIF, "leida": True}
        mock_get_client.return_value = make_client({"notificaciones": [updated]})
        result = marcar_leida("token", "user-1", "notif-1")
        assert result["leida"] is True

    @patch("app.services.notificaciones.get_user_client")
    def test_raises_404_when_not_found(self, mock_get_client: MagicMock) -> None:
        from fastapi import HTTPException

        mock_get_client.return_value = make_client({"notificaciones": []})
        with pytest.raises(HTTPException) as exc_info:
            marcar_leida("token", "user-1", "nonexistent-id")
        assert exc_info.value.status_code == 404


class TestMarcarTodasLeidas:
    @patch("app.services.notificaciones.get_user_client")
    def test_returns_count_of_updated(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client(
            {"notificaciones": [SAMPLE_NOTIF, SAMPLE_NOTIF]}
        )
        result = marcar_todas_leidas("token", "user-1")
        assert "actualizadas" in result
        assert isinstance(result["actualizadas"], int)


class TestEliminarNotificacion:
    @patch("app.services.notificaciones.get_user_client")
    def test_successful_deletion(self, mock_get_client: MagicMock) -> None:
        mock_get_client.return_value = make_client({"notificaciones": [SAMPLE_NOTIF]})
        # Should not raise
        eliminar_notificacion("token", "user-1", "notif-1")

    @patch("app.services.notificaciones.get_user_client")
    def test_raises_404_when_not_found(self, mock_get_client: MagicMock) -> None:
        from fastapi import HTTPException

        mock_get_client.return_value = make_client({"notificaciones": []})
        with pytest.raises(HTTPException) as exc_info:
            eliminar_notificacion("token", "user-1", "nonexistent-id")
        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# generar_notificaciones — Trigger 5: suscripciones
# ---------------------------------------------------------------------------


def make_full_client(data_map: dict) -> MagicMock:
    """Extended mock client that supports is_ chaining."""
    client = MagicMock()

    def table_side_effect(table_name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_query = MagicMock()
        mock_query.execute.return_value = MagicMock(data=data_map.get(table_name, []))
        mock_query.eq.return_value = mock_query
        mock_query.select.return_value = mock_query
        mock_query.update.return_value = mock_query
        mock_query.delete.return_value = mock_query
        mock_query.insert.return_value = mock_query
        mock_query.order.return_value = mock_query
        mock_query.limit.return_value = mock_query
        mock_query.gte.return_value = mock_query
        mock_query.lte.return_value = mock_query
        mock_query.is_.return_value = mock_query
        mock_table.select.return_value = mock_query
        mock_table.update.return_value = mock_query
        mock_table.delete.return_value = mock_query
        mock_table.insert.return_value = mock_query
        return mock_table

    client.table.side_effect = table_side_effect
    return client


class TestGenerarNotificacionesSuscripciones:
    @patch("app.services.notificaciones.get_user_client")
    def test_trigger5_suscripcion_within_7_days_creates_advertencia(
        self, mock_get_client: MagicMock
    ) -> None:
        """Suscripcion with fecha_proximo_cobro in 3 days triggers advertencia."""
        from app.services.notificaciones import generar_notificaciones

        today = date.today()
        cobro_en_3 = (today + timedelta(days=3)).isoformat()

        data_map = {
            "presupuestos": [],
            "egresos": [],
            "categorias": [],
            "prestamos": [],
            "pagos_prestamo": [],
            "notificaciones": [],
            "suscripciones": [
                {
                    "id": "sus-1",
                    "nombre": "Netflix",
                    "monto": 500,
                    "fecha_proximo_cobro": cobro_en_3,
                    "activa": True,
                }
            ],
            "recurrentes": [],
        }
        mock_get_client.return_value = make_full_client(data_map)

        with patch("app.services.notificaciones._crear_notificacion", return_value=True) as mock_crear:
            with patch("app.services.notificaciones._ya_existe_notificacion_reciente", return_value=False):
                result = generar_notificaciones("token", "user-1")

        calls = [str(c) for c in mock_crear.call_args_list]
        assert any("suscripcion_cobro_sus-1" in c for c in calls)

    @patch("app.services.notificaciones.get_user_client")
    def test_trigger5_suscripcion_today_creates_urgente(
        self, mock_get_client: MagicMock
    ) -> None:
        """Suscripcion with fecha_proximo_cobro today triggers urgente."""
        from app.services.notificaciones import generar_notificaciones

        today = date.today().isoformat()

        data_map = {
            "presupuestos": [],
            "egresos": [],
            "categorias": [],
            "prestamos": [],
            "pagos_prestamo": [],
            "notificaciones": [],
            "suscripciones": [
                {
                    "id": "sus-2",
                    "nombre": "Spotify",
                    "monto": 250,
                    "fecha_proximo_cobro": today,
                    "activa": True,
                }
            ],
            "recurrentes": [],
        }
        mock_get_client.return_value = make_full_client(data_map)

        captured_calls: list[tuple] = []

        def fake_crear(client, user_id, tipo, cat_key, titulo, mensaje):
            captured_calls.append((tipo, cat_key))
            return True

        with patch("app.services.notificaciones._crear_notificacion", side_effect=fake_crear):
            with patch("app.services.notificaciones._ya_existe_notificacion_reciente", return_value=False):
                generar_notificaciones("token", "user-1")

        suscripcion_calls = [(t, k) for t, k in captured_calls if "suscripcion_cobro_sus-2" in k]
        assert suscripcion_calls, "Expected a suscripcion_cobro_sus-2 notification"
        assert suscripcion_calls[0][0] == "urgente"


# ---------------------------------------------------------------------------
# generar_notificaciones — Trigger 6: recurrentes
# ---------------------------------------------------------------------------


class TestGenerarNotificacionesRecurrentes:
    @patch("app.services.notificaciones.get_user_client")
    def test_trigger6_mensual_due_within_7_days_creates_notification(
        self, mock_get_client: MagicMock
    ) -> None:
        """Monthly recurrente due in 2 days triggers advertencia."""
        from app.services.notificaciones import generar_notificaciones

        today = date.today()
        dia_en_2 = (today + timedelta(days=2)).day

        data_map = {
            "presupuestos": [],
            "egresos": [],
            "categorias": [],
            "prestamos": [],
            "pagos_prestamo": [],
            "notificaciones": [],
            "suscripciones": [],
            "recurrentes": [
                {
                    "id": "rec-1",
                    "descripcion": "Seguro de vida",
                    "monto": 1200,
                    "frecuencia": "mensual",
                    "dia_del_mes": dia_en_2,
                    "fecha_inicio": "2025-01-01",
                    "activo": True,
                    "tipo": "egreso",
                }
            ],
        }
        mock_get_client.return_value = make_full_client(data_map)

        captured_calls: list[tuple] = []

        def fake_crear(client, user_id, tipo, cat_key, titulo, mensaje):
            captured_calls.append((tipo, cat_key))
            return True

        with patch("app.services.notificaciones._crear_notificacion", side_effect=fake_crear):
            with patch("app.services.notificaciones._ya_existe_notificacion_reciente", return_value=False):
                generar_notificaciones("token", "user-1")

        rec_calls = [(t, k) for t, k in captured_calls if "recurrente_pago_rec-1" in k]
        assert rec_calls, "Expected recurrente_pago_rec-1 notification"

    @patch("app.services.notificaciones.get_user_client")
    def test_trigger6_non_mensual_skipped(
        self, mock_get_client: MagicMock
    ) -> None:
        """Weekly recurrentes are skipped (only mensual with dia_del_mes supported)."""
        from app.services.notificaciones import generar_notificaciones

        today = date.today()
        dia_manana = (today + timedelta(days=1)).day

        data_map = {
            "presupuestos": [],
            "egresos": [],
            "categorias": [],
            "prestamos": [],
            "pagos_prestamo": [],
            "notificaciones": [],
            "suscripciones": [],
            "recurrentes": [
                {
                    "id": "rec-2",
                    "descripcion": "Gimnasio",
                    "monto": 800,
                    "frecuencia": "semanal",
                    "dia_del_mes": dia_manana,
                    "fecha_inicio": "2025-01-01",
                    "activo": True,
                    "tipo": "egreso",
                }
            ],
        }
        mock_get_client.return_value = make_full_client(data_map)

        captured_calls: list[tuple] = []

        def fake_crear(client, user_id, tipo, cat_key, titulo, mensaje):
            captured_calls.append((tipo, cat_key))
            return True

        with patch("app.services.notificaciones._crear_notificacion", side_effect=fake_crear):
            with patch("app.services.notificaciones._ya_existe_notificacion_reciente", return_value=False):
                generar_notificaciones("token", "user-1")

        rec_calls = [(t, k) for t, k in captured_calls if "recurrente_pago_rec-2" in k]
        assert not rec_calls, "Weekly recurrente should not trigger notification"
