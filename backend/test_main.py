import pytest
import httpx
from fastapi import HTTPException
from backend.main import _http_error_from_meshy

def test_http_error_from_meshy_with_message():
    resp = httpx.Response(400, json={"message": "Invalid prompt", "other": "data"})
    exc = _http_error_from_meshy(resp)

    assert exc.status_code == 400
    assert exc.detail == {
        "message": "Invalid prompt",
        "raw": {"message": "Invalid prompt", "other": "data"}
    }

def test_http_error_from_meshy_without_message():
    resp = httpx.Response(403, json={"error": "forbidden"})
    exc = _http_error_from_meshy(resp)

    assert exc.status_code == 403
    assert exc.detail == {
        "raw": {"error": "forbidden"}
    }

def test_http_error_from_meshy_invalid_json():
    resp = httpx.Response(500, content=b"Internal Server Error")
    exc = _http_error_from_meshy(resp)

    assert exc.status_code == 500
    assert exc.detail == {
        "raw": "Internal Server Error"
    }

def test_http_error_from_meshy_json_array():
    resp = httpx.Response(422, json=[{"loc": ["body"], "msg": "field required"}])
    exc = _http_error_from_meshy(resp)

    assert exc.status_code == 422
    assert exc.detail == {
        "raw": [{"loc": ["body"], "msg": "field required"}]
    }

def test_http_error_from_meshy_empty_body():
    resp = httpx.Response(404, content=b"")
    exc = _http_error_from_meshy(resp)

    assert exc.status_code == 404
    assert exc.detail == {
        "raw": ""
    }
