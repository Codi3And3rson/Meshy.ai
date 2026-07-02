import pytest
import httpx
import asyncio
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from backend.main import _request_with_retries, MAX_RETRIES

@pytest.fixture
def mock_client():
    client = AsyncMock(spec=httpx.AsyncClient)
    return client

@pytest.fixture(autouse=True)
def mock_sleep():
    with patch("asyncio.sleep", new_callable=AsyncMock) as mock:
        yield mock

@pytest.mark.asyncio
async def test_request_with_retries_success(mock_client, mock_sleep):
    mock_response = httpx.Response(200, json={"ok": True}, request=httpx.Request("GET", "http://test"))
    mock_client.request.return_value = mock_response

    resp = await _request_with_retries(mock_client, "GET", "http://test", headers={"Auth": "123"})

    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
    mock_client.request.assert_called_once_with("GET", "http://test", headers={"Auth": "123"}, json=None)
    mock_sleep.assert_not_called()

@pytest.mark.asyncio
async def test_request_with_retries_idempotent_http_error(mock_client, mock_sleep):
    error_response = httpx.Response(502, json={"error": "bad gateway"}, request=httpx.Request("GET", "http://test"))
    success_response = httpx.Response(200, json={"ok": True}, request=httpx.Request("GET", "http://test"))

    # Fails once, then succeeds
    mock_client.request.side_effect = [error_response, success_response]

    resp = await _request_with_retries(mock_client, "GET", "http://test", headers={})

    assert resp.status_code == 200
    assert mock_client.request.call_count == 2
    mock_sleep.assert_called_once()

@pytest.mark.asyncio
async def test_request_with_retries_idempotent_http_error_exhaustion(mock_client, mock_sleep):
    error_response = httpx.Response(502, request=httpx.Request("GET", "http://test"))

    # Always fails
    mock_client.request.return_value = error_response

    resp = await _request_with_retries(mock_client, "GET", "http://test", headers={})

    assert resp.status_code == 502
    assert mock_client.request.call_count == MAX_RETRIES + 1
    assert mock_sleep.call_count == MAX_RETRIES

@pytest.mark.asyncio
async def test_request_with_retries_non_idempotent_http_error(mock_client, mock_sleep):
    error_response = httpx.Response(502, request=httpx.Request("POST", "http://test"))
    mock_client.request.return_value = error_response

    resp = await _request_with_retries(mock_client, "POST", "http://test", headers={})

    # Should not retry POST on 502
    assert resp.status_code == 502
    assert mock_client.request.call_count == 1
    mock_sleep.assert_not_called()

@pytest.mark.asyncio
async def test_request_with_retries_network_error_idempotent(mock_client, mock_sleep):
    success_response = httpx.Response(200, json={"ok": True}, request=httpx.Request("GET", "http://test"))

    # Fails with network error, then succeeds
    mock_client.request.side_effect = [httpx.TimeoutException("timeout"), success_response]

    resp = await _request_with_retries(mock_client, "GET", "http://test", headers={})

    assert resp.status_code == 200
    assert mock_client.request.call_count == 2
    mock_sleep.assert_called_once()

@pytest.mark.asyncio
async def test_request_with_retries_network_error_non_idempotent(mock_client, mock_sleep):
    success_response = httpx.Response(200, json={"ok": True}, request=httpx.Request("POST", "http://test"))

    # Fails with network error, then succeeds
    # Retries SHOULD happen for network errors even on POST
    mock_client.request.side_effect = [httpx.TransportError("connection error"), success_response]

    resp = await _request_with_retries(mock_client, "POST", "http://test", headers={})

    assert resp.status_code == 200
    assert mock_client.request.call_count == 2
    mock_sleep.assert_called_once()

@pytest.mark.asyncio
async def test_request_with_retries_network_error_exhaustion(mock_client, mock_sleep):
    # Always fails with network error
    mock_client.request.side_effect = httpx.TimeoutException("timeout")

    with pytest.raises(HTTPException) as exc_info:
        await _request_with_retries(mock_client, "POST", "http://test", headers={})

    assert exc_info.value.status_code == 502
    assert "Upstream network error" in exc_info.value.detail
    assert mock_client.request.call_count == MAX_RETRIES + 1
    assert mock_sleep.call_count == MAX_RETRIES
