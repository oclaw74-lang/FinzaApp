from unittest.mock import MagicMock, patch, call


def _make_mock_client(egresos_data, cat_data, existing_data):
    """Build a MagicMock supabase client that returns preset data for each table query."""
    mock = MagicMock()

    def table_side_effect(table_name):
        tbl = MagicMock()
        if table_name == "egresos":
            # chain: .select().eq().gte().lte().execute()
            tbl.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.return_value = MagicMock(
                data=egresos_data
            )
        elif table_name == "categorias":
            # chain: .select().execute()
            tbl.select.return_value.execute.return_value = MagicMock(data=cat_data)
        elif table_name == "presupuestos":
            # chain: .select().eq().eq().eq().execute()
            tbl.select.return_value.eq.return_value.eq.return_value.eq.return_value.execute.return_value = MagicMock(
                data=existing_data
            )
        return tbl

    mock.table.side_effect = table_side_effect
    return mock


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_returns_sorted_suggestions(mock_client):
    from app.services.presupuestos import get_sugeridos

    egresos = [
        {"monto": "3000", "categoria_id": "cat-1", "fecha": "2026-02-15"},
        {"monto": "2000", "categoria_id": "cat-1", "fecha": "2026-01-10"},
        {"monto": "1500", "categoria_id": "cat-2", "fecha": "2026-02-20"},
    ]
    cats = [
        {"id": "cat-1", "nombre": "Alimentacion"},
        {"id": "cat-2", "nombre": "Transporte"},
    ]
    mock_client.return_value = _make_mock_client(egresos, cats, [])

    # Target: March 2026 — last 3 months are Feb, Jan, Dec 2025
    result = get_sugeridos("jwt", "user-1", mes=3, year=2026)

    assert isinstance(result, list)
    assert len(result) == 2

    # cat-1: total 5000 over 3 months → avg = 5000/3 ≈ 1666.67 → 1666.67*1.1 ≈ 1833.33 → round to 1830
    cat1 = next(r for r in result if r["categoria_id"] == "cat-1")
    assert cat1["categoria_nombre"] == "Alimentacion"
    assert cat1["mes"] == 3
    assert cat1["year"] == 2026
    assert cat1["sugerido"] > 0
    # 10% buffer applied: sugerido >= avg
    assert cat1["sugerido"] >= cat1["promedio_mensual"]

    # Results must be sorted descending by sugerido
    suggested_amounts = [r["sugerido"] for r in result]
    assert suggested_amounts == sorted(suggested_amounts, reverse=True)


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_excludes_existing_presupuestos(mock_client):
    from app.services.presupuestos import get_sugeridos

    egresos = [
        {"monto": "1000", "categoria_id": "cat-1", "fecha": "2026-02-10"},
        {"monto": "500", "categoria_id": "cat-2", "fecha": "2026-01-05"},
    ]
    cats = [
        {"id": "cat-1", "nombre": "Alimentacion"},
        {"id": "cat-2", "nombre": "Transporte"},
    ]
    # cat-1 already has a presupuesto for march 2026
    existing = [{"categoria_id": "cat-1"}]
    mock_client.return_value = _make_mock_client(egresos, cats, existing)

    result = get_sugeridos("jwt", "user-1", mes=3, year=2026)

    ids = [r["categoria_id"] for r in result]
    assert "cat-1" not in ids
    assert "cat-2" in ids


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_10_percent_buffer_rounded(mock_client):
    from app.services.presupuestos import get_sugeridos

    # Spend exactly 1000 in one month, 0 in the other two
    # avg = 1000/3 ≈ 333.33 → *1.1 ≈ 366.67 → round to nearest 10 → 370
    egresos = [
        {"monto": "1000", "categoria_id": "cat-1", "fecha": "2026-02-01"},
    ]
    cats = [{"id": "cat-1", "nombre": "Alimentacion"}]
    mock_client.return_value = _make_mock_client(egresos, cats, [])

    result = get_sugeridos("jwt", "user-1", mes=3, year=2026)

    assert len(result) == 1
    # avg = 333.33, sugerido = round(333.33 * 1.1 / 10) * 10 = round(36.67) * 10 = 37 * 10 = 370
    assert result[0]["sugerido"] == 370.0
    assert abs(result[0]["promedio_mensual"] - round(1000 / 3, 2)) < 0.01


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_empty_when_no_egresos(mock_client):
    from app.services.presupuestos import get_sugeridos

    mock_client.return_value = _make_mock_client([], [], [])

    result = get_sugeridos("jwt", "user-1", mes=3, year=2026)
    assert result == []


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_skips_zero_suggestion(mock_client):
    from app.services.presupuestos import get_sugeridos

    # Very small amounts that round down to 0
    egresos = [
        {"monto": "0.01", "categoria_id": "cat-1", "fecha": "2026-02-01"},
    ]
    cats = [{"id": "cat-1", "nombre": "Minimo"}]
    mock_client.return_value = _make_mock_client(egresos, cats, [])

    result = get_sugeridos("jwt", "user-1", mes=3, year=2026)
    # 0.01/3 * 1.1 / 10 rounded = 0 → skipped
    assert result == []


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_handles_api_error_on_egresos(mock_client):
    from app.services.presupuestos import get_sugeridos
    from postgrest import APIError

    mock = MagicMock()

    def table_side_effect(table_name):
        tbl = MagicMock()
        if table_name == "egresos":
            tbl.select.return_value.eq.return_value.gte.return_value.lte.return_value.execute.side_effect = APIError(
                {"message": "error", "code": "500", "details": "", "hint": ""}
            )
        return tbl

    mock.table.side_effect = table_side_effect
    mock_client.return_value = mock

    result = get_sugeridos("jwt", "user-1", mes=3, year=2026)
    assert result == []


@patch("app.services.presupuestos.get_user_client")
def test_get_sugeridos_correct_month_range(mock_client):
    """Verify that egresos from outside the 3-month window are ignored."""
    from app.services.presupuestos import get_sugeridos

    # Target April 2026 — window is Jan, Feb, March 2026
    # Egreso in December 2025 should be outside the window and ignored
    egresos = [
        {"monto": "5000", "categoria_id": "cat-1", "fecha": "2025-12-01"},  # outside
        {"monto": "1000", "categoria_id": "cat-1", "fecha": "2026-01-15"},  # inside
    ]
    cats = [{"id": "cat-1", "nombre": "Alimentacion"}]
    mock_client.return_value = _make_mock_client(egresos, cats, [])

    result = get_sugeridos("jwt", "user-1", mes=4, year=2026)

    assert len(result) == 1
    # Only jan egreso counted: avg = 1000/3, sugerido = round(1000/3 * 1.1 / 10) * 10
    assert result[0]["promedio_mensual"] == round(1000 / 3, 2)
