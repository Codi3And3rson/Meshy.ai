import pytest
import httpx
from unittest.mock import Mock
from fastapi import HTTPException
from backend.main import _http_error_from_meshy

def test_http_error_from_meshy_with_message():
    """Test scenario: JSON body with a 'message' key."""
    mock_resp = Mock(spec=httpx.Response)
    mock_resp.status_code = 400
    mock_resp.text = '{"message": "Invalid prompt", "other": "data"}'
    mock_resp.json.return_value = {"message": "Invalid prompt", "other": "data"}

    exc = _http_error_from_meshy(mock_resp)

    assert isinstance(exc, HTTPException)
    assert exc.status_code == 400
    assert exc.detail == {
        "message": "Invalid prompt",
        "raw": {"message": "Invalid prompt", "other": "data"}
    }

def test_http_error_from_meshy_without_message():
    """Test scenario: Valid JSON body without a 'message' key."""
    mock_resp = Mock(spec=httpx.Response)
    mock_resp.status_code = 422
    mock_resp.text = '{"error": "Validation failed"}'
    mock_resp.json.return_value = {"error": "Validation failed"}

    exc = _http_error_from_meshy(mock_resp)

    assert isinstance(exc, HTTPException)
    assert exc.status_code == 422
    assert exc.detail == {
        "raw": {"error": "Validation failed"}
    }

def test_http_error_from_meshy_invalid_json():
    """Test scenario: Invalid JSON or plain text body."""
    mock_resp = Mock(spec=httpx.Response)
    mock_resp.status_code = 500
    mock_resp.text = "Internal Server Error"
    mock_resp.json.side_effect = Exception("Not valid JSON")

    exc = _http_error_from_meshy(mock_resp)

    assert isinstance(exc, HTTPException)
    assert exc.status_code == 500
    assert exc.detail == {
        "raw": "Internal Server Error"
    }

def test_http_error_from_meshy_fallback_parsing():
    """
    Test scenario: resp.json() raises an Exception but the text
    is still successfully parsed by _safe_json.
    """
    mock_resp = Mock(spec=httpx.Response)
    mock_resp.status_code = 403
    mock_resp.text = '{"message": "Forbidden fallback"}'
    # Simulate a scenario where resp.json() fails, perhaps due to
    # some weird response object behavior or missing content-type
    mock_resp.json.side_effect = Exception("json() failed")

    exc = _http_error_from_meshy(mock_resp)

    assert isinstance(exc, HTTPException)
    assert exc.status_code == 403
    # Note: _safe_json will correctly parse '{"message": "Forbidden fallback"}'
    # into a dict with "message", so it should hit the first condition.
    assert exc.detail == {
        "message": "Forbidden fallback",
        "raw": {"message": "Forbidden fallback"}
    }
