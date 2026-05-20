import pytest
from fastapi import HTTPException
from main import _validate_download_url

def test_validate_download_url_allowed():
    # Exact match
    _validate_download_url("https://assets.meshy.ai/some/file.png")
    # Subdomain match
    _validate_download_url("https://cdn.assets.meshy.ai/some/file.png")

def test_validate_download_url_invalid_scheme():
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("ftp://assets.meshy.ai/some/file.png")
    assert exc.value.status_code == 400

def test_validate_download_url_normal_disallowed():
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("http://example.com")
    assert exc.value.status_code == 403

def test_validate_download_url_malformed():
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("not a url")
    assert exc.value.status_code == 400

def test_validate_download_url_ssrf_bypasses():
    # These URLs are crafted to bypass simple host extraction logic.
    # By using httpx.URL for parsing, we ensure the host is parsed securely exactly as httpx will process it.
    bypasses = [
        r"http://assets.meshy.ai\@127.0.0.1",
        "http://assets.meshy.ai%20@127.0.0.1",
        "http://assets.meshy.ai%09@127.0.0.1",
        "http://assets.meshy.ai%5C@127.0.0.1",
    ]
    for url in bypasses:
        with pytest.raises(HTTPException) as exc:
            _validate_download_url(url)
        assert exc.value.status_code == 403, f"Bypass succeeded for {url}"
