from unittest.mock import MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client() -> AsyncClient:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_supabase_client():
    """Returns a MagicMock that mimics the supabase Client interface."""
    mock_client = MagicMock()
    # Default chain: .table().select().execute() -> empty data
    mock_response = MagicMock()
    mock_response.data = []
    mock_response.count = 0
    mock_client.table.return_value.select.return_value.order.return_value.execute.return_value = mock_response
    mock_client.table.return_value.select.return_value.eq.return_value.maybe_single.return_value.execute.return_value = mock_response
    return mock_client


@pytest.fixture
def mock_current_user():
    return {"user_id": "00000000-0000-0000-0000-000000000001", "email": "test@test.com", "role": "authenticated"}
