from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services.educacion import get_lecciones, marcar_completada


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_client_dual(lecciones_data: list, progreso_data: list) -> MagicMock:
    """Build a mock client that returns different data per table name."""
    client = MagicMock()

    def table_side_effect(name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_q = MagicMock()

        if name == "lecciones":
            mock_q.execute.return_value = MagicMock(data=lecciones_data)
        elif name == "user_lecciones":
            mock_q.execute.return_value = MagicMock(data=progreso_data)

        mock_q.select.return_value = mock_q
        mock_q.eq.return_value = mock_q
        mock_q.order.return_value = mock_q
        mock_q.upsert.return_value = mock_q
        mock_table.select.return_value = mock_q
        mock_table.upsert.return_value = mock_q
        return mock_table

    client.table.side_effect = table_side_effect
    return client


# ---------------------------------------------------------------------------
# get_lecciones
# ---------------------------------------------------------------------------

class TestGetLecciones:
    @patch("app.services.educacion.get_user_client")
    def test_returns_lecciones_with_completada_false(self, mock_gc: MagicMock) -> None:
        leccion = {
            "id": "l1",
            "titulo": "El presupuesto 50/30/20",
            "descripcion_corta": "Aprende la regla",
            "contenido_json": {"hook": "test"},
            "nivel": "fundamentos",
            "duracion_minutos": 3,
            "orden": 1,
        }
        mock_gc.return_value = _make_client_dual([leccion], [])
        result = get_lecciones("token", "user-1")
        assert len(result) == 1
        assert result[0]["completada"] is False

    @patch("app.services.educacion.get_user_client")
    def test_marks_completada_true_when_progreso_exists(self, mock_gc: MagicMock) -> None:
        leccion = {
            "id": "l1",
            "titulo": "Fondo de emergencia",
            "descripcion_corta": "3 meses",
            "contenido_json": {"hook": "test"},
            "nivel": "fundamentos",
            "duracion_minutos": 3,
            "orden": 2,
        }
        progreso = [{"leccion_id": "l1", "completada": True}]
        mock_gc.return_value = _make_client_dual([leccion], progreso)
        result = get_lecciones("token", "user-1")
        assert result[0]["completada"] is True

    @patch("app.services.educacion.get_user_client")
    def test_incomplete_progress_not_counted(self, mock_gc: MagicMock) -> None:
        leccion = {"id": "l1", "titulo": "x", "descripcion_corta": "y",
                   "contenido_json": {}, "nivel": "control", "duracion_minutos": 3, "orden": 1}
        progreso = [{"leccion_id": "l1", "completada": False}]
        mock_gc.return_value = _make_client_dual([leccion], progreso)
        result = get_lecciones("token", "user-1")
        assert result[0]["completada"] is False

    @patch("app.services.educacion.get_user_client")
    def test_empty_lecciones_returns_empty_list(self, mock_gc: MagicMock) -> None:
        mock_gc.return_value = _make_client_dual([], [])
        result = get_lecciones("token", "user-1")
        assert result == []


# ---------------------------------------------------------------------------
# marcar_completada
# ---------------------------------------------------------------------------

class TestMarcarCompletada:
    @patch("app.services.educacion.get_user_client")
    def test_returns_leccion_id_and_completada_true(self, mock_gc: MagicMock) -> None:
        client = MagicMock()
        mock_table = MagicMock()
        mock_q = MagicMock()
        mock_q.execute.return_value = MagicMock(data=[])
        mock_table.upsert.return_value = mock_q
        client.table.return_value = mock_table
        mock_gc.return_value = client

        result = marcar_completada("token", "user-1", "l1")
        assert result == {"leccion_id": "l1", "completada": True}

    @patch("app.services.educacion.get_user_client")
    def test_upsert_called_with_correct_fields(self, mock_gc: MagicMock) -> None:
        client = MagicMock()
        mock_table = MagicMock()
        mock_q = MagicMock()
        mock_q.execute.return_value = MagicMock(data=[])
        mock_table.upsert.return_value = mock_q
        client.table.return_value = mock_table
        mock_gc.return_value = client

        marcar_completada("token", "user-1", "l1")
        call_args = mock_table.upsert.call_args
        payload = call_args[0][0]
        assert payload["user_id"] == "user-1"
        assert payload["leccion_id"] == "l1"
        assert payload["completada"] is True
        assert "completada_en" in payload
