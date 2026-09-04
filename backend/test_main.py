import pytest
from httpx import AsyncClient
from fastapi.testclient import TestClient

from backend.main import app, normalize_task


@pytest.fixture
def test_client():
    with TestClient(app) as client:
        yield client


def test_health_endpoint(test_client):
    response = test_client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "meshy_base" in data
    assert "max_data_url_chars" in data


def test_retention_endpoint(test_client):
    response = test_client.get("/api/retention")
    assert response.status_code == 200
    data = response.json()
    assert "note" in data
    assert "max_days_non_enterprise" in data


def test_webhook_endpoint(test_client):
    payload = {"status": "SUCCEEDED", "id": "test_123"}
    response = test_client.post("/api/meshy/webhook", json=payload)
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_balance_endpoint(test_client, mocker):
    mock_resp = mocker.Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"credits": 100}

    mocker.patch("backend.main._request_with_retries", return_value=mock_resp)

    response = test_client.get("/api/balance", headers={"x-meshy-key": "test_key"})
    assert response.status_code == 200
    assert response.json() == {"credits": 100}


def test_balance_endpoint_missing_key(test_client, mocker):
    mocker.patch("backend.main.SERVER_MESHY_API_KEY", None)
    response = test_client.get("/api/balance")
    assert response.status_code == 401
    assert "Missing API key" in response.json()["detail"]


def test_create_text_to_3d_preview(test_client, mocker):
    mock_resp = mocker.Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"result": "task_123"}
    mocker.patch("backend.main._request_with_retries", return_value=mock_resp)

    payload = {"mode": "preview", "prompt": "a cute cat"}
    response = test_client.post(
        "/api/text-to-3d", json=payload, headers={"x-meshy-key": "test_key"}
    )
    assert response.status_code == 200
    assert response.json() == {"result": "task_123"}


def test_create_image_to_3d(test_client, mocker):
    mock_resp = mocker.Mock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"result": "task_456"}
    mocker.patch("backend.main._request_with_retries", return_value=mock_resp)

    payload = {"image_url": "https://example.com/image.jpg", "enable_pbr": True}
    response = test_client.post(
        "/api/image-to-3d", json=payload, headers={"x-meshy-key": "test_key"}
    )
    assert response.status_code == 200
    assert response.json() == {"result": "task_456"}


def test_normalize_task():
    raw_task = {
        "id": "123",
        "status": "SUCCEEDED",
        "progress": 100,
        "model_urls": {"glb": "https://example.com/url.glb"},
    }
    normalized = normalize_task(raw_task)
    assert normalized["status"] == "SUCCEEDED"
    assert normalized["model_urls"] == {"glb": "https://example.com/url.glb"}
    assert "raw" in normalized


@pytest.mark.asyncio
async def test_download_proxy(mocker):
    # To fix the attribute error on mock_send during client.get, it happens because our mock
    # interferes with ALL AsyncClient.send calls, including the test's own request!
    # A better approach is to use `test_client.get("/api/download")` but we mock `httpx.AsyncClient.send`
    # only inside `backend.main.app.state.http_stream`.

    class MockUpstream:
        status_code = 200
        headers = {"content-type": "model/gltf-binary", "content-length": "10"}

        async def aread(self):
            return b"some data"

        async def aclose(self):
            pass

        async def aiter_bytes(self, chunk_size):
            yield b"some data"

    async def mock_send(*args, **kwargs):
        return MockUpstream()

    # We only patch the method on the instance that backend.main uses!
    # Because app.state.http_stream is set on startup, we can just patch it globally on the class
    # but we must ONLY patch it if the request is going to assets.meshy.ai

    original_send = AsyncClient.send

    async def side_effect_send(self, request, *args, **kwargs):
        if "assets.meshy.ai" in str(request.url):
            return MockUpstream()
        return await original_send(self, request, *args, **kwargs)

    mocker.patch("httpx.AsyncClient.send", autospec=True, side_effect=side_effect_send)

    url = "https://assets.meshy.ai/test.glb"

    with TestClient(app) as test_client:
        response = test_client.get(f"/api/download?url={url}")

    assert response.status_code == 200
    assert response.headers["content-type"] == "model/gltf-binary"
    assert response.content == b"some data"
