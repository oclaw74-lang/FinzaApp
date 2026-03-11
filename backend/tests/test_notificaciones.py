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
