from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/profiles/me")
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_profile_requires_auth(client: AsyncClient) -> None:
    response = await client.patch("/api/v1/profiles/me", json={"salario_mensual_neto": 50000})
    assert response.status_code == 403


@patch("app.services.profiles.get_user_client")
def test_get_or_create_creates_when_missing(mock_client: MagicMock) -> None:
    from app.services.profiles import get_or_create_profile

    mock = MagicMock()
    # First call returns None (no existing profile)
    mock.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(data=None)
    mock.table.return_value.insert.return_value.execute.return_value = MagicMock(
        data=[{"user_id": "u-1", "salario_mensual_neto": None, "mostrar_horas_trabajo": False}]
    )
    mock_client.return_value = mock

    result = get_or_create_profile("jwt", "u-1")
    assert result["user_id"] == "u-1"
    assert result["horas_por_peso"] is None


@patch("app.services.profiles.get_user_client")
def test_horas_por_peso_calculated(mock_client: MagicMock) -> None:
    from app.services.profiles import get_or_create_profile

    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
        data={"user_id": "u-1", "salario_mensual_neto": "16000.00", "mostrar_horas_trabajo": True}
    )
    mock_client.return_value = mock

    result = get_or_create_profile("jwt", "u-1")
    assert result["horas_por_peso"] is not None
    # 160 / 16000 = 0.01 horas por peso
    assert abs(result["horas_por_peso"] - 0.01) < 0.001


@patch("app.services.profiles.get_user_client")
def test_update_profile_sets_salario(mock_client: MagicMock) -> None:
    from app.services.profiles import update_profile
    from app.schemas.profile import ProfileUpdate

    mock = MagicMock()
    mock.table.return_value.upsert.return_value.execute.return_value = MagicMock(
        data=[{"user_id": "u-1", "salario_mensual_neto": "50000.00", "mostrar_horas_trabajo": False}]
    )
    mock_client.return_value = mock

    result = update_profile("jwt", "u-1", ProfileUpdate(salario_mensual_neto=50000))
    assert result["salario_mensual_neto"] == 50000.0
    assert result["horas_por_peso"] is not None


@patch("app.services.profiles.get_user_client")
def test_onboarding_completed_defaults_false(mock_client: MagicMock) -> None:
    from app.services.profiles import get_or_create_profile

    mock = MagicMock()
    mock.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = MagicMock(
        data={
            "user_id": "u-1",
            "salario_mensual_neto": None,
            "mostrar_horas_trabajo": False,
            "onboarding_completed": False,
        }
    )
    mock_client.return_value = mock

    result = get_or_create_profile("jwt", "u-1")
    assert result["onboarding_completed"] is False


@patch("app.services.profiles.get_user_client")
def test_onboarding_completed_can_be_set_true(mock_client: MagicMock) -> None:
    from app.services.profiles import update_profile
    from app.schemas.profile import ProfileUpdate

    mock = MagicMock()
    mock.table.return_value.upsert.return_value.execute.return_value = MagicMock(
        data=[{
            "user_id": "u-1",
            "salario_mensual_neto": None,
            "mostrar_horas_trabajo": False,
            "onboarding_completed": True,
        }]
    )
    mock_client.return_value = mock

    result = update_profile("jwt", "u-1", ProfileUpdate(onboarding_completed=True))
    assert result["onboarding_completed"] is True

    # Verify upsert was called with onboarding_completed in payload
    call_kwargs = mock.table.return_value.upsert.call_args[0][0]
    assert call_kwargs.get("onboarding_completed") is True


@patch("app.services.profiles.get_user_client")
def test_onboarding_completed_false_not_filtered_out(mock_client: MagicMock) -> None:
    """Setting onboarding_completed=False must reach the DB (not be filtered by exclude_none)."""
    from app.services.profiles import update_profile
    from app.schemas.profile import ProfileUpdate

    mock = MagicMock()
    mock.table.return_value.upsert.return_value.execute.return_value = MagicMock(
        data=[{
            "user_id": "u-1",
            "salario_mensual_neto": None,
            "mostrar_horas_trabajo": False,
            "onboarding_completed": False,
        }]
    )
    mock_client.return_value = mock

    result = update_profile("jwt", "u-1", ProfileUpdate(onboarding_completed=False))
    assert result["onboarding_completed"] is False

    call_kwargs = mock.table.return_value.upsert.call_args[0][0]
    assert "onboarding_completed" in call_kwargs
    assert call_kwargs["onboarding_completed"] is False
