from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_login_logout():
    resp = client.post("/api/auth/login", json={"api_key": "test_key"})
    assert resp.status_code == 200
    assert "meshy_api_key" in resp.cookies
    assert resp.cookies["meshy_api_key"] == "test_key"

    resp = client.get("/api/auth/status")
    assert resp.json()["is_authed"] is True

    resp = client.post("/api/auth/logout")
    assert resp.status_code == 200
    assert "meshy_api_key" not in resp.cookies or resp.cookies["meshy_api_key"] == ""
