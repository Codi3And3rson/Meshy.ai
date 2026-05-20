import pytest
from main import _safe_json

def test_safe_json_valid_object():
    assert _safe_json('{"key": "value"}') == {"key": "value"}

def test_safe_json_valid_array():
    assert _safe_json('[1, 2, 3]') == [1, 2, 3]

def test_safe_json_valid_literal():
    assert _safe_json('"hello"') == "hello"

def test_safe_json_invalid_string():
    assert _safe_json('{malformed}') is None

def test_safe_json_empty_string():
    assert _safe_json('') is None

def test_safe_json_non_string():
    assert _safe_json(None) is None
    assert _safe_json(123) is None
