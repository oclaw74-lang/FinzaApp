from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.services.retos import (
    abandonar_reto,
    aceptar_reto,
    checkin_reto,
    get_catalogo,
    get_mis_retos,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_simple_client(table_data: dict) -> MagicMock:
    """Build a mock supabase client for simple select queries."""
    client = MagicMock()

    def table_side_effect(name: str) -> MagicMock:
        mock_table = MagicMock()
        mock_q = MagicMock()
        mock_q.execute.return_value = MagicMock(data=table_data.get(name, []))
        mock_q.select.return_value = mock_q
        mock_q.eq.return_value = mock_q
        mock_q.order.return_value = mock_q
        mock_q.insert.return_value = mock_q
        mock_q.update.return_value = mock_q
        mock_q.single.return_value = mock_q
        mock_table.select.return_value = mock_q
        mock_table.insert.return_value = mock_q
        mock_table.update.return_value = mock_q
        return mock_table

    client.table.side_effect = table_side_effect
    return client


# ---------------------------------------------------------------------------
# get_catalogo
# ---------------------------------------------------------------------------

class TestGetCatalogo:
    @patch("app.services.retos.get_user_client")
    def test_returns_retos_list(self, mock_gc: MagicMock) -> None:
        reto = {"id": "r1", "titulo": "Sin cafe", "tipo": "semanal"}
        mock_gc.return_value = _make_simple_client({"retos": [reto]})
        result = get_catalogo("token")
        assert result == [reto]

    @patch("app.services.retos.get_user_client")
    def test_empty_catalog_returns_empty_list(self, mock_gc: MagicMock) -> None:
        mock_gc.return_value = _make_simple_client({"retos": []})
        result = get_catalogo("token")
        assert result == []


# ---------------------------------------------------------------------------
# get_mis_retos
# ---------------------------------------------------------------------------

class TestGetMisRetos:
    @patch("app.services.retos.get_user_client")
    def test_returns_active_retos_with_fields(self, mock_gc: MagicMock) -> None:
        ur_row = {
            "id": "ur1",
            "reto_id": "r1",
            "estado": "activo",
            "racha_dias": 3,
            "ultimo_checkin": "2026-03-15",
            "iniciado_en": "2026-03-01T00:00:00Z",
            "retos": {
                "titulo": "Sin cafe",
                "descripcion": "No compres cafe",
                "tipo": "semanal",
                "ahorro_estimado": 500,
                "icono": "☕",
            },
        }
        mock_gc.return_value = _make_simple_client({"user_retos": [ur_row]})
        result = get_mis_retos("token", "user-1")
        assert len(result) == 1
        item = result[0]
        assert item["id"] == "ur1"
        assert item["titulo"] == "Sin cafe"
        assert item["racha_dias"] == 3
        assert "puede_checkin_hoy" in item

    @patch("app.services.retos.get_user_client")
    def test_no_active_retos_returns_empty(self, mock_gc: MagicMock) -> None:
        mock_gc.return_value = _make_simple_client({"user_retos": []})
        result = get_mis_retos("token", "user-1")
        assert result == []


# ---------------------------------------------------------------------------
# aceptar_reto
# ---------------------------------------------------------------------------

class TestAceptarReto:
    @patch("app.services.retos.get_user_client")
    def test_inserts_and_returns_row(self, mock_gc: MagicMock) -> None:
        row = {"id": "ur-new", "reto_id": "r1", "user_id": "user-1", "estado": "activo"}
        client = MagicMock()
        mock_table = MagicMock()
        mock_q = MagicMock()
        mock_q.execute.return_value = MagicMock(data=[row])
        mock_q.eq.return_value = mock_q
        mock_table.insert.return_value = mock_q
        client.table.return_value = mock_table
        mock_gc.return_value = client
        result = aceptar_reto("token", "user-1", "r1")
        assert result["id"] == "ur-new"

    @patch("app.services.retos.get_user_client")
    def test_duplicate_reto_raises_409(self, mock_gc: MagicMock) -> None:
        from postgrest import APIError
        client = MagicMock()
        mock_table = MagicMock()
        mock_q = MagicMock()
        error = APIError({"code": "23505", "message": "unique_violation", "details": None, "hint": None})
        mock_q.execute.side_effect = error
        mock_table.insert.return_value = mock_q
        client.table.return_value = mock_table
        mock_gc.return_value = client
        with pytest.raises(HTTPException) as exc_info:
            aceptar_reto("token", "user-1", "r1")
        assert exc_info.value.status_code == 409


# ---------------------------------------------------------------------------
# checkin_reto
# ---------------------------------------------------------------------------

class TestCheckinReto:
    @patch("app.services.retos.get_user_client")
    def test_checkin_increments_racha(self, mock_gc: MagicMock) -> None:
        existing_row = {
            "id": "ur1",
            "user_id": "user-1",
            "racha_dias": 2,
            "ultimo_checkin": "2026-03-14",
        }
        client = MagicMock()
        mock_table = MagicMock()
        mock_select_q = MagicMock()
        mock_select_q.execute.return_value = MagicMock(data=existing_row)
        mock_select_q.eq.return_value = mock_select_q
        mock_select_q.single.return_value = mock_select_q
        mock_select_q.select.return_value = mock_select_q
        mock_update_q = MagicMock()
        mock_update_q.execute.return_value = MagicMock(data=[])
        mock_update_q.eq.return_value = mock_update_q
        mock_table.select.return_value = mock_select_q
        mock_table.update.return_value = mock_update_q
        client.table.return_value = mock_table
        mock_gc.return_value = client

        result = checkin_reto("token", "user-1", "ur1")
        assert result["racha_dias"] == 3
        assert "message" in result

    @patch("app.services.retos.get_user_client")
    def test_checkin_today_raises_400(self, mock_gc: MagicMock) -> None:
        from datetime import date
        today = date.today().isoformat()
        existing_row = {
            "id": "ur1",
            "user_id": "user-1",
            "racha_dias": 5,
            "ultimo_checkin": today,
        }
        client = MagicMock()
        mock_table = MagicMock()
        mock_q = MagicMock()
        mock_q.execute.return_value = MagicMock(data=existing_row)
        mock_q.eq.return_value = mock_q
        mock_q.single.return_value = mock_q
        mock_q.select.return_value = mock_q
        mock_table.select.return_value = mock_q
        client.table.return_value = mock_table
        mock_gc.return_value = client

        with pytest.raises(HTTPException) as exc_info:
            checkin_reto("token", "user-1", "ur1")
        assert exc_info.value.status_code == 400


# ---------------------------------------------------------------------------
# abandonar_reto
# ---------------------------------------------------------------------------

class TestAbandonarReto:
    @patch("app.services.retos.get_user_client")
    def test_updates_estado_to_abandonado(self, mock_gc: MagicMock) -> None:
        client = MagicMock()
        mock_table = MagicMock()
        mock_q = MagicMock()
        mock_q.execute.return_value = MagicMock(data=[])
        mock_q.eq.return_value = mock_q
        mock_table.update.return_value = mock_q
        client.table.return_value = mock_table
        mock_gc.return_value = client

        result = abandonar_reto("token", "user-1", "ur1")
        assert result is None
        mock_table.update.assert_called_once_with({"estado": "abandonado"})
