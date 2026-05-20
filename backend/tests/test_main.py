import pytest
from unittest.mock import patch
from fastapi import HTTPException
from backend.main import _validate_download_url

def test_validate_download_url_valid():
    # Valid urls, matching exact host and subdomain
    _validate_download_url("https://assets.meshy.ai/some/file.obj")
    _validate_download_url("http://sub.assets.meshy.ai/file")

def test_validate_download_url_invalid_scheme():
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("ftp://assets.meshy.ai/file")
    assert exc.value.status_code == 400
    assert exc.value.detail == "Download URL must be http/https"

def test_validate_download_url_missing_host():
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("https:///file")
    assert exc.value.status_code == 400
    assert exc.value.detail == "Download URL missing host"

def test_validate_download_url_host_not_allowed():
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("https://evil.com/file")
    assert exc.value.status_code == 403
    assert "Download host not allowed" in exc.value.detail

@patch('backend.main.urlparse')
def test_validate_download_url_invalid_urlparse(mock_urlparse):
    mock_urlparse.side_effect = Exception("Invalid URL")
    with pytest.raises(HTTPException) as exc:
        _validate_download_url("invalid_url")
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid download URL"
