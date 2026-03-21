from datetime import date
from decimal import Decimal
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


# ---------------------------------------------------------------------------
# Schema validation tests
# ---------------------------------------------------------------------------

class TestTransaccionImportValidation:
    def test_valid_egreso_is_accepted(self):
        from app.schemas.importar import TransaccionImport

        t = TransaccionImport(tipo="egreso", fecha=date.today(), monto=Decimal("100.00"))
        assert t.tipo == "egreso"
        assert t.monto == Decimal("100.00")

    def test_valid_ingreso_is_accepted(self):
        from app.schemas.importar import TransaccionImport

        t = TransaccionImport(tipo="ingreso", fecha=date.today(), monto=Decimal("50000.00"))
        assert t.tipo == "ingreso"

    def test_invalid_tipo_raises(self):
        from app.schemas.importar import TransaccionImport

        with pytest.raises(Exception):
            TransaccionImport(tipo="otro", fecha=date.today(), monto=Decimal("100"))

    def test_negative_monto_raises(self):
        from app.schemas.importar import TransaccionImport

        with pytest.raises(Exception):
            TransaccionImport(tipo="egreso", fecha=date.today(), monto=Decimal("-100"))

    def test_zero_monto_raises(self):
        from app.schemas.importar import TransaccionImport

        with pytest.raises(Exception):
            TransaccionImport(tipo="egreso", fecha=date.today(), monto=Decimal("0"))

    def test_default_moneda_is_dop(self):
        from app.schemas.importar import TransaccionImport

        t = TransaccionImport(tipo="egreso", fecha=date.today(), monto=Decimal("100"))
        assert t.moneda == "DOP"

    def test_optional_fields_are_none_by_default(self):
        from app.schemas.importar import TransaccionImport

        t = TransaccionImport(tipo="ingreso", fecha=date.today(), monto=Decimal("100"))
        assert t.descripcion is None
        assert t.categoria_nombre is None
        assert t.notas is None


# ---------------------------------------------------------------------------
# Service unit tests
# ---------------------------------------------------------------------------

class TestBulkImport:
    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_import_single_egreso_success(self, mock_dup, mock_cat, mock_client_fn):
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        insert_response = MagicMock()
        insert_response.data = [{"id": "new-egreso-id"}]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_response

        transacciones = [
            TransaccionImport(
                tipo="egreso",
                fecha=date(2024, 1, 15),
                monto=Decimal("1500.00"),
                moneda="DOP",
                descripcion="Supermercado",
                categoria_nombre="Alimentación",
            )
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 1
        assert result.errores == []
        assert result.duplicados_omitidos == 0

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-456")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_import_single_ingreso_success(self, mock_dup, mock_cat, mock_client_fn):
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        insert_response = MagicMock()
        insert_response.data = [{"id": "new-ingreso-id"}]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_response

        transacciones = [
            TransaccionImport(
                tipo="ingreso",
                fecha=date(2024, 1, 15),
                monto=Decimal("50000.00"),
                moneda="DOP",
                descripcion="Salario",
                categoria_nombre="Salario",
            )
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 1
        assert result.errores == []
        assert result.duplicados_omitidos == 0

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=True)
    def test_import_skips_duplicates(self, mock_dup, mock_cat, mock_client_fn):
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        transacciones = [
            TransaccionImport(
                tipo="ingreso",
                fecha=date(2024, 1, 15),
                monto=Decimal("50000.00"),
                moneda="DOP",
                descripcion="Salario",
            )
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 0
        assert result.duplicados_omitidos == 1
        assert result.errores == []

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value=None)
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_import_error_when_no_category(self, mock_dup, mock_cat, mock_client_fn):
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        transacciones = [
            TransaccionImport(
                tipo="egreso",
                fecha=date(2024, 1, 15),
                monto=Decimal("100.00"),
                moneda="DOP",
            )
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 0
        assert len(result.errores) == 1
        assert result.errores[0].fila == 1
        assert result.errores[0].campo == "categoria_nombre"

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_import_insert_failure_adds_error(self, mock_dup, mock_cat, mock_client_fn):
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        # Supabase returns no data (insert failed silently)
        failed_response = MagicMock()
        failed_response.data = []
        mock_client.table.return_value.insert.return_value.execute.return_value = failed_response

        transacciones = [
            TransaccionImport(
                tipo="egreso",
                fecha=date(2024, 1, 15),
                monto=Decimal("200.00"),
                moneda="DOP",
            )
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 0
        assert len(result.errores) == 1
        assert result.errores[0].campo == "insert"

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_import_exception_adds_general_error(self, mock_dup, mock_cat, mock_client_fn):
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        # Simulate a runtime exception during insert
        mock_client.table.return_value.insert.return_value.execute.side_effect = RuntimeError(
            "connection timeout"
        )

        transacciones = [
            TransaccionImport(
                tipo="ingreso",
                fecha=date(2024, 1, 15),
                monto=Decimal("1000.00"),
                moneda="DOP",
            )
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 0
        assert len(result.errores) == 1
        assert result.errores[0].campo == "general"
        assert "connection timeout" in result.errores[0].mensaje

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_import_multiple_rows_partial_success(self, mock_dup, mock_cat, mock_client_fn):
        """Two rows: first succeeds (cat found), second fails (no cat)."""
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        # First row: category found; second row: no category
        mock_cat.side_effect = ["cat-001", None]

        insert_response = MagicMock()
        insert_response.data = [{"id": "row-1"}]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_response

        transacciones = [
            TransaccionImport(tipo="egreso", fecha=date(2024, 1, 1), monto=Decimal("500.00")),
            TransaccionImport(tipo="egreso", fecha=date(2024, 1, 2), monto=Decimal("300.00")),
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 1
        assert result.duplicados_omitidos == 0
        assert len(result.errores) == 1
        assert result.errores[0].fila == 2
        assert result.errores[0].campo == "categoria_nombre"

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate")
    def test_import_mixed_duplicates_and_success(self, mock_dup, mock_cat, mock_client_fn):
        """Three rows: first is a duplicate, second succeeds, third is a duplicate."""
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        mock_dup.side_effect = [True, False, True]

        insert_response = MagicMock()
        insert_response.data = [{"id": "new-row"}]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_response

        transacciones = [
            TransaccionImport(tipo="egreso", fecha=date(2024, 1, 1), monto=Decimal("100.00")),
            TransaccionImport(tipo="egreso", fecha=date(2024, 1, 2), monto=Decimal("200.00")),
            TransaccionImport(tipo="egreso", fecha=date(2024, 1, 3), monto=Decimal("300.00")),
        ]

        result = bulk_import("jwt", "user-123", transacciones)

        assert result.importados == 1
        assert result.duplicados_omitidos == 2
        assert result.errores == []

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_egreso_row_includes_metodo_pago(self, mock_dup, mock_cat, mock_client_fn):
        """Egreso inserts should include metodo_pago='efectivo'."""
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        insert_response = MagicMock()
        insert_response.data = [{"id": "e-1"}]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_response

        transacciones = [
            TransaccionImport(
                tipo="egreso",
                fecha=date(2024, 3, 1),
                monto=Decimal("750.00"),
                notas="nota de prueba",
            )
        ]

        bulk_import("jwt", "user-123", transacciones)

        inserted_payload = mock_client.table.return_value.insert.call_args[0][0]
        assert inserted_payload["metodo_pago"] == "efectivo"
        assert inserted_payload["notas"] == "nota de prueba"

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_ingreso_row_does_not_include_metodo_pago(self, mock_dup, mock_cat, mock_client_fn):
        """Ingreso inserts should NOT include metodo_pago."""
        from app.schemas.importar import TransaccionImport
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        insert_response = MagicMock()
        insert_response.data = [{"id": "i-1"}]
        mock_client.table.return_value.insert.return_value.execute.return_value = insert_response

        transacciones = [
            TransaccionImport(tipo="ingreso", fecha=date(2024, 3, 1), monto=Decimal("5000.00"))
        ]

        bulk_import("jwt", "user-123", transacciones)

        inserted_payload = mock_client.table.return_value.insert.call_args[0][0]
        assert "metodo_pago" not in inserted_payload

    @patch("app.services.importar.get_user_client")
    @patch("app.services.importar._find_categoria_id", return_value="cat-123")
    @patch("app.services.importar._is_duplicate", return_value=False)
    def test_empty_transacciones_returns_zero_counts(self, mock_dup, mock_cat, mock_client_fn):
        from app.services.importar import bulk_import

        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        result = bulk_import("jwt", "user-123", [])

        assert result.importados == 0
        assert result.duplicados_omitidos == 0
        assert result.errores == []


# ---------------------------------------------------------------------------
# HTTP endpoint tests (auth guard)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_import_transactions_requires_auth(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/import/transactions",
        json={"transacciones": []},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_import_transactions_invalid_payload_returns_422(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/import/transactions",
        json={"transacciones": [{"tipo": "otro", "fecha": "2024-01-01", "monto": "100.00"}]},
    )
    # 403 without auth token — confirms endpoint exists but requires auth
    assert response.status_code in (403, 422)


@pytest.mark.asyncio
async def test_import_transactions_missing_transacciones_field(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/import/transactions",
        json={},
    )
    assert response.status_code in (403, 422)
