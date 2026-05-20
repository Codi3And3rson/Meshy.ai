import pytest
from backend.main import _extract_bearer_token

def test_extract_bearer_token_none():
    assert _extract_bearer_token(None) is None

def test_extract_bearer_token_empty_and_whitespace():
    assert _extract_bearer_token("") is None
    assert _extract_bearer_token("   ") is None

def test_extract_bearer_token_raw_token():
    assert _extract_bearer_token("mytoken123") == "mytoken123"
    assert _extract_bearer_token("  mytoken123  ") == "mytoken123"
    assert _extract_bearer_token("my token 123") == "my token 123"

def test_extract_bearer_token_with_bearer_prefix():
    assert _extract_bearer_token("Bearer mytoken123") == "mytoken123"
    assert _extract_bearer_token("bearer mytoken123") == "mytoken123"
    assert _extract_bearer_token("BEARER mytoken123") == "mytoken123"
    assert _extract_bearer_token("Bearer   mytoken123  ") == "mytoken123"
    assert _extract_bearer_token("Bearer my token 123") == "my token 123"

def test_extract_bearer_token_bearer_prefix_only():
    assert _extract_bearer_token("Bearer ") is None
    assert _extract_bearer_token("bearer    ") is None

    # "Bearer" without trailing space shouldn't be treated as a valid token either
    assert _extract_bearer_token("Bearer") is None
