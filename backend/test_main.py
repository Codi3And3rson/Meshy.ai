import pytest
from fastapi import HTTPException
from backend.main import _require_api_key, _extract_bearer_token

def test_extract_bearer_token():
    assert _extract_bearer_token(None) is None
    assert _extract_bearer_token("") is None
    assert _extract_bearer_token("   ") is None
    assert _extract_bearer_token("Bearer some-token") == "some-token"
    assert _extract_bearer_token("bearer another-token") == "another-token"
    assert _extract_bearer_token("raw-token") == "raw-token"

def test_require_api_key_server_key_set(monkeypatch):
    monkeypatch.setattr("backend.main.SERVER_MESHY_API_KEY", "server-key")
    # Should return SERVER_MESHY_API_KEY ignoring other arguments
    assert _require_api_key(x_meshy_key="x-key", authorization="Bearer bearer-key") == "server-key"
    assert _require_api_key(x_meshy_key=None, authorization=None) == "server-key"

def test_require_api_key_bearer_token(monkeypatch):
    monkeypatch.setattr("backend.main.SERVER_MESHY_API_KEY", None)

    # Priority 2: Authorization header
    assert _require_api_key(x_meshy_key="x-key", authorization="Bearer bearer-key") == "bearer-key"
    assert _require_api_key(x_meshy_key=None, authorization="Bearer bearer-key") == "bearer-key"
    assert _require_api_key(x_meshy_key=None, authorization="raw-token") == "raw-token"

def test_require_api_key_x_meshy_key(monkeypatch):
    monkeypatch.setattr("backend.main.SERVER_MESHY_API_KEY", None)

    # Priority 3: X-Meshy-Key header
    assert _require_api_key(x_meshy_key="x-key", authorization=None) == "x-key"
    assert _require_api_key(x_meshy_key="  x-key-padded  ", authorization="  ") == "x-key-padded"

def test_require_api_key_missing_raises_401(monkeypatch):
    monkeypatch.setattr("backend.main.SERVER_MESHY_API_KEY", None)

    with pytest.raises(HTTPException) as excinfo:
        _require_api_key(x_meshy_key=None, authorization=None)
    assert excinfo.value.status_code == 401
    assert "Missing API key" in excinfo.value.detail

    with pytest.raises(HTTPException) as excinfo:
        _require_api_key(x_meshy_key="   ", authorization="   ")
    assert excinfo.value.status_code == 401
    assert "Missing API key" in excinfo.value.detail
