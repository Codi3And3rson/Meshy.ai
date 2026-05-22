import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

from backend.main import app


@pytest.fixture
def client():
    # Make sure startup events are fired so httpx clients are created
    with TestClient(app) as client:
        yield client


@pytest.mark.asyncio
async def test_upstream_error_redaction(client):
    # Mock httpx.AsyncClient.stream to return a 400 error response
    # It returns an object that can be read asynchronously and closed
    class MockStreamResponse:
        def __init__(self, status_code, content):
            self.status_code = status_code
            self.content = content
            self.headers = {
                "content-type": "text/plain",
                "content-length": str(len(content)),
            }

        async def aread(self):
            return self.content

        async def aclose(self):
            pass

    mock_response = MockStreamResponse(
        400, b"Secret upstream error trace that shouldn't be exposed"
    )

    with patch.object(
        app.state.http_stream, "stream", new_callable=AsyncMock
    ) as mock_stream:
        mock_stream.return_value = mock_response

        response = client.get(
            "/api/download", params={"url": "http://assets.meshy.ai/test.obj"}
        )

        assert response.status_code == 400
        data = response.json()
        assert "message" in data["detail"]
        assert data["detail"]["message"] == "Upstream error"
        assert "raw" not in data["detail"]
