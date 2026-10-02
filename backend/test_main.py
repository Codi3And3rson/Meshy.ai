from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient
from backend.main import app, normalize_task, _extract_bearer_token


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert "allowed_download_hosts" in data


def test_retention_endpoint(client):
    response = client.get("/api/retention")
    assert response.status_code == 200
    data = response.json()
    assert "max_days_non_enterprise" in data


def test_webhook_endpoint(client):
    response = client.post(
        "/api/meshy/webhook", json={"task_id": "test_123", "status": "SUCCEEDED"}
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_missing_api_key_returns_401(client):
    with patch("backend.main.SERVER_MESHY_API_KEY", None):
        response = client.get("/api/balance")
        assert response.status_code == 401
        assert "Missing API key" in response.json()["detail"]


def test_normalize_task_parsing():
    raw_task = {
        "id": "task_999",
        "status": "SUCCEEDED",
        "model_urls": {
            "glb": "https://assets.meshy.ai/model.glb",
            "fbx": "https://assets.meshy.ai/model.fbx",
        },
        "thumbnail_url": "https://assets.meshy.ai/thumb.png",
    }
    normalized = normalize_task(raw_task)
    assert normalized["status"] == "SUCCEEDED"
    assert normalized["model"]["format"] == "glb"
    assert normalized["model"]["download_url"] == "https://assets.meshy.ai/model.glb"
    assert normalized["thumbnail_url"] == "https://assets.meshy.ai/thumb.png"


def test_invalid_download_host(client):
    response = client.get(
        "/api/download", params={"url": "https://malicious.site/evil.exe"}
    )
    assert response.status_code == 403
    assert "Download host not allowed" in response.json()["detail"]


def test_invalid_download_url_scheme(client):
    response = client.get(
        "/api/download", params={"url": "ftp://assets.meshy.ai/file.glb"}
    )
    assert response.status_code == 400

def test_extract_bearer_token():
    assert _extract_bearer_token(None) is None
    assert _extract_bearer_token("") is None
    assert _extract_bearer_token("   ") is None
    assert _extract_bearer_token("Bearer token123") == "token123"
    assert _extract_bearer_token("bearer token123") == "token123"
    assert _extract_bearer_token("token123") == "token123"
    # The edge case we specifically want to test
    assert _extract_bearer_token("Bearer ") is None
