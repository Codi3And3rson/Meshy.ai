import pytest
from fastapi import HTTPException
import backend.main as main
from backend.main import _require_api_key

def test_require_api_key_server_key(monkeypatch):
    monkeypatch.setattr(main, "SERVER_MESHY_API_KEY", "server_key")
    # Even if other keys are provided, server key should take priority
    assert _require_api_key("x_key", "Bearer auth_key") == "server_key"
    assert _require_api_key(None, None) == "server_key"

def test_require_api_key_bearer_auth(monkeypatch):
    monkeypatch.setattr(main, "SERVER_MESHY_API_KEY", None)
    # With Bearer prefix
    assert _require_api_key(None, "Bearer auth_token") == "auth_token"
    # Without Bearer prefix
    assert _require_api_key(None, "auth_token") == "auth_token"
    # Takes priority over x_meshy_key
    assert _require_api_key("x_key", "Bearer auth_token") == "auth_token"

def test_require_api_key_x_meshy_key(monkeypatch):
    monkeypatch.setattr(main, "SERVER_MESHY_API_KEY", None)
    assert _require_api_key("x_key", None) == "x_key"
    assert _require_api_key(" x_key ", "") == "x_key"

def test_require_api_key_missing(monkeypatch):
    monkeypatch.setattr(main, "SERVER_MESHY_API_KEY", None)
    with pytest.raises(HTTPException) as exc_info:
        _require_api_key(None, None)
    assert exc_info.value.status_code == 401
    assert "Missing API key" in exc_info.value.detail

    with pytest.raises(HTTPException) as exc_info:
        _require_api_key("   ", "")
    assert exc_info.value.status_code == 401
