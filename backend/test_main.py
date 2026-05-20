import pytest
from fastapi.testclient import TestClient
from main import app, normalize_task, _extract_bearer_token, _filename_from_url, _validate_download_url
from fastapi import HTTPException

def test_health():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["ok"] is True
        assert "meshy_base" in data

def test_retention():
    with TestClient(app) as client:
        response = client.get("/api/retention")
        assert response.status_code == 200
        data = response.json()
        assert "max_days_non_enterprise" in data

def test_extract_bearer_token():
    assert _extract_bearer_token(None) is None
    assert _extract_bearer_token("") is None
    assert _extract_bearer_token("Bearer 12345") == "12345"
    assert _extract_bearer_token("12345") == "12345"
    assert _extract_bearer_token("bearer abc") == "abc"

def test_filename_from_url():
    assert _filename_from_url("https://example.com/file.obj") == "file.obj"
    assert _filename_from_url("https://example.com/some/path/test.glb") == "test.glb"
    assert _filename_from_url("invalid_url", fallback="default.bin") in ("invalid_url", "default.bin")

def test_normalize_task():
    raw = {
        "status": "SUCCEEDED",
        "model_urls": {
            "glb": "https://example.com/model.glb"
        },
        "thumbnail_url": "https://example.com/thumb.png"
    }
    normalized = normalize_task(raw)
    assert normalized["status"] == "SUCCEEDED"
    assert normalized["model"]["download_url"] == "https://example.com/model.glb"
    assert normalized["model"]["format"] == "glb"
    assert normalized["thumbnail_url"] == "https://example.com/thumb.png"

def test_validate_download_url_valid():
    # ALLOWED_DOWNLOAD_HOSTS defaults to assets.meshy.ai
    try:
        _validate_download_url("https://assets.meshy.ai/file.glb")
    except HTTPException:
        pytest.fail("HTTPException raised unexpectedly")

def test_validate_download_url_invalid():
    with pytest.raises(HTTPException) as exc_info:
        _validate_download_url("https://evil.com/file.glb")
    assert exc_info.value.status_code == 403

def test_validate_download_url_invalid_scheme():
    with pytest.raises(HTTPException) as exc_info:
        _validate_download_url("ftp://assets.meshy.ai/file.glb")
    assert exc_info.value.status_code == 400
