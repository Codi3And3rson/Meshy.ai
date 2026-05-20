import httpx
from fastapi import HTTPException
from backend.main import _http_error_from_meshy

def test_http_error_from_meshy_with_message():
    resp = httpx.Response(400, json={"message": "Invalid request", "other": "data"})
    exc = _http_error_from_meshy(resp)
    assert isinstance(exc, HTTPException)
    assert exc.status_code == 400
    assert exc.detail == {
        "message": "Invalid request",
        "raw": {"message": "Invalid request", "other": "data"}
    }

def test_http_error_from_meshy_without_message():
    resp = httpx.Response(403, json={"error": "Forbidden"})
    exc = _http_error_from_meshy(resp)
    assert exc.status_code == 403
    assert exc.detail == {
        "raw": {"error": "Forbidden"}
    }

def test_http_error_from_meshy_non_dict_json():
    resp = httpx.Response(500, json=["some", "list"])
    exc = _http_error_from_meshy(resp)
    assert exc.status_code == 500
    assert exc.detail == {
        "raw": ["some", "list"]
    }

def test_http_error_from_meshy_invalid_json():
    resp = httpx.Response(502, text="Bad Gateway HTML")
    exc = _http_error_from_meshy(resp)
    assert exc.status_code == 502
    assert exc.detail == {
        "raw": "Bad Gateway HTML"
    }

def test_http_error_from_meshy_empty_body():
    resp = httpx.Response(404, text="")
    exc = _http_error_from_meshy(resp)
    assert exc.status_code == 404
    assert exc.detail == {
        "raw": ""
    }
