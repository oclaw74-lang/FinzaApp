"""Tests for dual-currency (dual-moneda) feature."""
from unittest.mock import MagicMock, patch

import pytest


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_supabase_chain(mock_client: MagicMock, return_value):
    """Wire up the common .table().select().eq().maybe_single().execute() chain."""
    (
        mock_client.table.return_value
        .select.return_value
        .eq.return_value
        .maybe_single.return_value
        .execute.return_value
    ) = return_value


def _make_response(data):
    mock_resp = MagicMock()
    mock_resp.data = data
    return mock_resp


# ---------------------------------------------------------------------------
# TestGetDualMonedaConfig
# ---------------------------------------------------------------------------


class TestGetDualMonedaConfig:
    @patch("app.services.dual_moneda.get_user_client")
    def test_returns_config_when_exists(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client
        _make_supabase_chain(
            mock_client,
            _make_response({
                "moneda": "DOP",
                "moneda_secundaria": "USD",
                "tasa_cambio": 59.5,
                "tasa_cambio_actualizada_at": None,
            }),
        )

        from app.services.dual_moneda import get_dual_moneda_config

        result = get_dual_moneda_config("test-jwt", "user-123")

        assert result.moneda_principal == "DOP"
        assert result.moneda_secundaria == "USD"
        assert result.tasa_cambio == 59.5
        assert result.tasa_cambio_actualizada_at is None

    @patch("app.services.dual_moneda.get_user_client")
    def test_returns_default_when_no_config(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client
        # supabase-py 2.x: None response when record not found via maybe_single
        _make_supabase_chain(mock_client, None)

        from app.services.dual_moneda import get_dual_moneda_config

        result = get_dual_moneda_config("test-jwt", "user-123")

        assert result.moneda_principal == "DOP"
        assert result.moneda_secundaria is None
        assert result.tasa_cambio is None

    @patch("app.services.dual_moneda.get_user_client")
    def test_returns_default_when_response_data_is_none(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client
        mock_resp = MagicMock()
        mock_resp.data = None
        _make_supabase_chain(mock_client, mock_resp)

        from app.services.dual_moneda import get_dual_moneda_config

        result = get_dual_moneda_config("test-jwt", "user-123")

        assert result.moneda_principal == "DOP"
        assert result.moneda_secundaria is None

    @patch("app.services.dual_moneda.get_user_client")
    def test_falls_back_to_dop_when_moneda_is_none(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client
        _make_supabase_chain(
            mock_client,
            _make_response({
                "moneda": None,
                "moneda_secundaria": "EUR",
                "tasa_cambio": 1.1,
                "tasa_cambio_actualizada_at": None,
            }),
        )

        from app.services.dual_moneda import get_dual_moneda_config

        result = get_dual_moneda_config("test-jwt", "user-123")

        assert result.moneda_principal == "DOP"
        assert result.moneda_secundaria == "EUR"


# ---------------------------------------------------------------------------
# TestUpdateDualMonedaConfig
# ---------------------------------------------------------------------------


class TestUpdateDualMonedaConfig:
    @patch("app.services.dual_moneda.get_user_client")
    def test_updates_tasa_cambio_and_returns_config(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        # Wire update chain (returns ignored)
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        # Wire get-after-update chain
        _make_supabase_chain(
            mock_client,
            _make_response({
                "moneda": "DOP",
                "moneda_secundaria": "USD",
                "tasa_cambio": 60.0,
                "tasa_cambio_actualizada_at": "2026-07-01T00:00:00+00:00",
            }),
        )

        from app.schemas.dual_moneda import DualMonedaUpdate
        from app.services.dual_moneda import update_dual_moneda_config

        result = update_dual_moneda_config(
            "test-jwt", "user-123", DualMonedaUpdate(tasa_cambio=60.0)
        )

        assert result.tasa_cambio == 60.0
        assert result.moneda_secundaria == "USD"

    @patch("app.services.dual_moneda.get_user_client")
    def test_clears_moneda_secundaria_with_empty_string(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        _make_supabase_chain(
            mock_client,
            _make_response({
                "moneda": "DOP",
                "moneda_secundaria": None,
                "tasa_cambio": None,
                "tasa_cambio_actualizada_at": None,
            }),
        )

        from app.schemas.dual_moneda import DualMonedaUpdate
        from app.services.dual_moneda import update_dual_moneda_config

        result = update_dual_moneda_config(
            "test-jwt", "user-123", DualMonedaUpdate(moneda_secundaria="")
        )

        assert result.moneda_secundaria is None

    @patch("app.services.dual_moneda.get_user_client")
    def test_returns_current_config_when_no_fields_provided(self, mock_client_fn):
        """When payload has no fields to update, returns existing config unchanged."""
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client
        _make_supabase_chain(
            mock_client,
            _make_response({
                "moneda": "DOP",
                "moneda_secundaria": "USD",
                "tasa_cambio": 59.5,
                "tasa_cambio_actualizada_at": None,
            }),
        )

        from app.schemas.dual_moneda import DualMonedaUpdate
        from app.services.dual_moneda import update_dual_moneda_config

        result = update_dual_moneda_config(
            "test-jwt", "user-123", DualMonedaUpdate()
        )

        # No update call should have been made
        mock_client.table.return_value.update.assert_not_called()
        assert result.moneda_principal == "DOP"
        assert result.moneda_secundaria == "USD"


# ---------------------------------------------------------------------------
# TestDualMonedaSchemas
# ---------------------------------------------------------------------------


class TestDualMonedaSchemas:
    def test_dual_moneda_config_defaults(self):
        from app.schemas.dual_moneda import DualMonedaConfig

        config = DualMonedaConfig(moneda_principal="DOP")
        assert config.moneda_principal == "DOP"
        assert config.moneda_secundaria is None
        assert config.tasa_cambio is None
        assert config.tasa_cambio_actualizada_at is None

    def test_dual_moneda_update_all_optional(self):
        from app.schemas.dual_moneda import DualMonedaUpdate

        update = DualMonedaUpdate()
        assert update.moneda_secundaria is None
        assert update.tasa_cambio is None

    def test_dual_moneda_update_with_values(self):
        from app.schemas.dual_moneda import DualMonedaUpdate

        update = DualMonedaUpdate(moneda_secundaria="USD", tasa_cambio=59.5)
        assert update.moneda_secundaria == "USD"
        assert update.tasa_cambio == 59.5


# ---------------------------------------------------------------------------
# TestDualMonedaEndpoints — HTTP auth guard
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_dual_moneda_requires_auth(client) -> None:
    response = await client.get("/api/v1/config/dual-moneda")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_put_dual_moneda_requires_auth(client) -> None:
    response = await client.put(
        "/api/v1/config/dual-moneda", json={"tasa_cambio": 59.5}
    )
    assert response.status_code == 403
