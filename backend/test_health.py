from fastapi.testclient import TestClient
from backend.main import app


def test_health():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "meshy_base" in data
        assert "using_server_key" in data
        assert "asset_retention_note" in data
        assert "max_data_url_chars" in data
        assert "allowed_download_hosts" in data
        assert "max_download_bytes" in data
