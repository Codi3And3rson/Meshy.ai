import pytest
from main import _filename_from_url

def test_filename_from_url_basic():
    assert _filename_from_url("https://example.com/path/to/file.obj") == "file.obj"

def test_filename_from_url_no_path():
    assert _filename_from_url("https://example.com/") == "download.bin"
    assert _filename_from_url("https://example.com") == "download.bin"

def test_filename_from_url_empty():
    assert _filename_from_url("") == "download.bin"

def test_filename_from_url_with_query_and_fragment():
    assert _filename_from_url("https://example.com/file.glb?version=1.0#part1") == "file.glb"

def test_filename_from_url_url_encoded():
    assert _filename_from_url("https://example.com/my%20file.fbx") == "my file.fbx"

def test_filename_from_url_custom_fallback():
    assert _filename_from_url("", fallback="custom.obj") == "custom.obj"
    assert _filename_from_url("https://example.com/", fallback="custom.obj") == "custom.obj"

def test_filename_from_url_invalid_url():
    # If a very malformed URL somehow gets passed
    assert _filename_from_url(None) == "download.bin"

def test_filename_from_url_only_path():
    assert _filename_from_url("/local/path/to/model.gltf") == "model.gltf"

def test_filename_from_url_trailing_slash():
    assert _filename_from_url("https://example.com/path/to/dir/") == "download.bin"
