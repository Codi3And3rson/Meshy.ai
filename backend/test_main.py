import pytest
from fastapi import HTTPException
from unittest import mock

from backend.main import _validate_download_url


def test_validate_download_url_valid():
    # valid https and allowed host
    assert _validate_download_url("https://assets.meshy.ai/some/path") is None
    # valid http and allowed host
    assert _validate_download_url("http://assets.meshy.ai/") is None
    # valid subdomain
    assert _validate_download_url("https://sub.assets.meshy.ai/") is None


def test_validate_download_url_invalid_scheme():
    with pytest.raises(HTTPException) as exc_info:
        _validate_download_url("ftp://assets.meshy.ai/some/path")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Download URL must be http/https"


def test_validate_download_url_missing_host():
    with pytest.raises(HTTPException) as exc_info:
        _validate_download_url("https:///some/path")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Download URL missing host"


def test_validate_download_url_unallowed_host():
    with pytest.raises(HTTPException) as exc_info:
        _validate_download_url("https://evil.com/some/path")
    assert exc_info.value.status_code == 403
    assert "Download host not allowed: evil.com." in exc_info.value.detail


@mock.patch("backend.main.urlparse")
def test_validate_download_url_exception(mock_urlparse):
    mock_urlparse.side_effect = Exception("Mocked exception")
    with pytest.raises(HTTPException) as exc_info:
        _validate_download_url("https://assets.meshy.ai/")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Invalid download URL"
