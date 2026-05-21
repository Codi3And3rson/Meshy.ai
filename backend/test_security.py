import pytest
from fastapi.testclient import TestClient
import urllib.parse
from backend.main import app

client = TestClient(app)

def test_download_proxy_filename_quote_escape(monkeypatch):
    import httpx

    class MockStream:
        def __init__(self, *args, **kwargs):
            self.status_code = 200
            self.headers = {"content-type": "text/plain", "content-length": "10"}
        async def aread(self):
            return b"test"
        async def aclose(self):
            pass
        async def aiter_bytes(self, chunk_size):
            yield b"1234567890"

    class MockAsyncClient:
        async def stream(self, *args, **kwargs):
            return MockStream()

    # Create app state manually since we aren't running startup event
    app.state.http_stream = MockAsyncClient()

    # The download URL must be valid
    url = "https://assets.meshy.ai/some-model.glb"

    # Payload designed to break out of quotes and inject attributes
    evil_filename = 'model"; filename="hacked.glb'
    quoted_evil = urllib.parse.quote(evil_filename)

    response = client.get(f"/api/download?url={url}&filename={quoted_evil}")

    content_disp = response.headers.get("content-disposition", "")
    print(f"Content-Disposition: {content_disp!r}")

    # Check that double quotes are replaced with underscores inside the string
    assert '"' not in content_disp[22:-1], f"Quote Injection possible! {content_disp!r}"
    assert "model_; filename=_hacked.glb" in content_disp
