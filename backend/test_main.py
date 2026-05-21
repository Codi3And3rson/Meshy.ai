import pytest
import httpx
import asyncio
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi import HTTPException

# Assuming the function is imported from main
from main import _request_with_retries, MAX_RETRIES

@pytest.fixture
def mock_sleep():
    with patch("asyncio.sleep", new_callable=AsyncMock) as mock:
        yield mock

@pytest.fixture
def mock_client():
    client = AsyncMock(spec=httpx.AsyncClient)
    return client

@pytest.mark.asyncio
async def test_request_with_retries_network_error_success_eventually(mock_client, mock_sleep):
    url = "http://test.com"
    headers = {}

    # Setup mock to raise TimeoutException twice, then succeed
    resp_success = MagicMock(spec=httpx.Response)
    resp_success.status_code = 200

    mock_client.request.side_effect = [
        httpx.TimeoutException("timeout"),
        httpx.TransportError("transport error"),
        resp_success
    ]

    resp = await _request_with_retries(mock_client, "POST", url, headers=headers)

    assert resp.status_code == 200
    assert mock_client.request.call_count == 3
    assert mock_sleep.call_count == 2

@pytest.mark.asyncio
async def test_request_with_retries_network_error_exhausted(mock_client, mock_sleep):
    url = "http://test.com"
    headers = {}

    # Setup mock to always raise TimeoutException
    mock_client.request.side_effect = httpx.TimeoutException("timeout")

    with pytest.raises(HTTPException) as exc_info:
        await _request_with_retries(mock_client, "POST", url, headers=headers)

    assert exc_info.value.status_code == 502
    assert "Upstream network error" in exc_info.value.detail
    assert mock_client.request.call_count == MAX_RETRIES + 1
    assert mock_sleep.call_count == MAX_RETRIES

@pytest.mark.asyncio
async def test_request_with_retries_idempotent_5xx_success_eventually(mock_client, mock_sleep):
    url = "http://test.com"
    headers = {}

    resp_500 = MagicMock(spec=httpx.Response)
    resp_500.status_code = 500

    resp_success = MagicMock(spec=httpx.Response)
    resp_success.status_code = 200

    # Setup mock to return 500, then 200
    mock_client.request.side_effect = [
        resp_500,
        resp_success
    ]

    resp = await _request_with_retries(mock_client, "GET", url, headers=headers)

    assert resp.status_code == 200
    assert mock_client.request.call_count == 2
    assert mock_sleep.call_count == 1

@pytest.mark.asyncio
async def test_request_with_retries_non_idempotent_5xx_no_retry(mock_client, mock_sleep):
    url = "http://test.com"
    headers = {}

    resp_500 = MagicMock(spec=httpx.Response)
    resp_500.status_code = 500

    # Setup mock to return 500
    mock_client.request.return_value = resp_500

    resp = await _request_with_retries(mock_client, "POST", url, headers=headers)

    assert resp.status_code == 500
    assert mock_client.request.call_count == 1
    assert mock_sleep.call_count == 0

@pytest.mark.asyncio
async def test_request_with_retries_idempotent_5xx_exhausted(mock_client, mock_sleep):
    url = "http://test.com"
    headers = {}

    resp_500 = MagicMock(spec=httpx.Response)
    resp_500.status_code = 500

    # Setup mock to always return 500
    mock_client.request.return_value = resp_500

    resp = await _request_with_retries(mock_client, "GET", url, headers=headers)

    assert resp.status_code == 500
    assert mock_client.request.call_count == MAX_RETRIES + 1
    assert mock_sleep.call_count == MAX_RETRIES

@pytest.mark.asyncio
async def test_request_with_retries_no_retry_400(mock_client, mock_sleep):
    url = "http://test.com"
    headers = {}

    resp_400 = MagicMock(spec=httpx.Response)
    resp_400.status_code = 400

    # Setup mock to return 400
    mock_client.request.return_value = resp_400

    resp = await _request_with_retries(mock_client, "GET", url, headers=headers)

    assert resp.status_code == 400
    assert mock_client.request.call_count == 1
    assert mock_sleep.call_count == 0
