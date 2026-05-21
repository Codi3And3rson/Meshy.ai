from backend.main import _extract_bearer_token


def test_extract_bearer_token():
    # Test None and empty/whitespace strings
    assert _extract_bearer_token(None) is None
    assert _extract_bearer_token("") is None
    assert _extract_bearer_token("   ") is None

    # Test Bearer prefix (case-insensitive)
    assert _extract_bearer_token("Bearer mytoken") == "mytoken"
    assert _extract_bearer_token("bearer mytoken") == "mytoken"
    assert _extract_bearer_token("BEARER mytoken") == "mytoken"
    assert _extract_bearer_token("BeArEr mytoken") == "mytoken"

    # Test Bearer prefix with extra spaces
    assert _extract_bearer_token("Bearer    mytoken  ") == "mytoken"
    assert _extract_bearer_token("  Bearer mytoken  ") == "mytoken"

    # Test Bearer prefix with spaces in the token itself
    assert _extract_bearer_token("Bearer my token") == "my token"

    # Test Bearer prefix with no token
    assert _extract_bearer_token("Bearer ") is None
    assert _extract_bearer_token("Bearer    ") is None

    # Test raw token without Bearer prefix
    assert _extract_bearer_token("mytoken") == "mytoken"
    assert _extract_bearer_token("  mytoken  ") == "mytoken"
    assert (
        _extract_bearer_token("Bearer") is None
    )  # Should probably be None because if a client just sends "Bearer", they likely failed to send the token.
