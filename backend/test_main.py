import pytest
import httpx
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from backend.main import app, MAX_DOWNLOAD_BYTES

@pytest_asyncio.fixture
async def async_client():
    async with LifespanManager(app):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            yield client

@pytest.mark.asyncio
async def test_download_proxy_invalid_url(async_client):
    resp = await async_client.get("/api/download?url=not_a_url")
    assert resp.status_code in [400, 422]

@pytest.mark.asyncio
async def test_download_proxy_disallowed_host(async_client):
    resp = await async_client.get("/api/download?url=https://evil.com/file.bin")
    assert resp.status_code == 403

@pytest.mark.asyncio
async def test_download_proxy_happy_path(async_client):
    class FakeStreamContext:
        def __init__(self):
            self.status_code = 200
            self.headers = {"content-type": "image/png", "content-length": "100"}
        def __await__(self):
            # This makes the object awaitable, returning itself
            async def _awaitable():
                return self
            return _awaitable().__await__()
        async def aiter_bytes(self, chunk_size):
            yield b"fake "
            yield b"data"
        async def aread(self):
            return b"fake data"
        async def aclose(self):
            pass

    with patch("httpx.AsyncClient.stream", return_value=FakeStreamContext()):
        resp = await async_client.get("/api/download?url=https://assets.meshy.ai/file.bin")
        assert resp.status_code == 200
        assert resp.content == b"fake data"

@pytest.mark.asyncio
async def test_download_proxy_upstream_error(async_client):
    class FakeErrorContext:
        def __init__(self):
            self.status_code = 404
            self.headers = {}
        def __await__(self):
            async def _awaitable():
                return self
            return _awaitable().__await__()
        async def aread(self):
            return b"Not found upstream"
        async def aclose(self):
            pass

    with patch("httpx.AsyncClient.stream", return_value=FakeErrorContext()):
        resp = await async_client.get("/api/download?url=https://assets.meshy.ai/file.bin")
        assert resp.status_code == 404
        assert "Upstream error" in resp.text

@pytest.mark.asyncio
async def test_download_proxy_too_large_header(async_client):
    class FakeLargeHeaderContext:
        def __init__(self):
            self.status_code = 200
            self.headers = {"content-length": str(MAX_DOWNLOAD_BYTES + 1)}
        def __await__(self):
            async def _awaitable():
                return self
            return _awaitable().__await__()
        async def aclose(self):
            pass

    with patch("httpx.AsyncClient.stream", return_value=FakeLargeHeaderContext()):
        resp = await async_client.get("/api/download?url=https://assets.meshy.ai/file.bin")
        assert resp.status_code == 413
        assert "File too large" in resp.text

@pytest.mark.asyncio
async def test_download_proxy_too_large_stream(async_client):
    class FakeLargeStreamContext:
        def __init__(self):
            self.status_code = 200
            self.headers = {}
        def __await__(self):
            async def _awaitable():
                return self
            return _awaitable().__await__()
        async def aiter_bytes(self, chunk_size):
            yield b"a" * (MAX_DOWNLOAD_BYTES // 2)
            yield b"b" * (MAX_DOWNLOAD_BYTES // 2 + 1024)
        async def aclose(self):
            pass

    with patch("httpx.AsyncClient.stream", return_value=FakeLargeStreamContext()):
        with pytest.raises(RuntimeError) as exc_info:
            await async_client.get("/api/download?url=https://assets.meshy.ai/file.bin")
        assert "Caught handled exception, but response already started." in str(exc_info.value)

@pytest.mark.asyncio
async def test_download_proxy_timeout(async_client):
    async def side_effect(*args, **kwargs):
        raise httpx.TimeoutException("Timeout")
    mock = AsyncMock(side_effect=side_effect)
    with patch("httpx.AsyncClient.stream", mock):
        resp = await async_client.get("/api/download?url=https://assets.meshy.ai/file.bin")
        assert resp.status_code == 502
