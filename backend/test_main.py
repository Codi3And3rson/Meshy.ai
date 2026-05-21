import pytest
from backend.main import _safe_json

@pytest.mark.parametrize(
    "input_text, expected_output",
    [
        # Valid JSON
        ('{"key": "value"}', {"key": "value"}),
        ('[1, 2, 3]', [1, 2, 3]),
        ('"string"', "string"),
        ('123', 123),
        ('true', True),
        ('null', None),
        # Invalid JSON
        ('{invalid json}', None),
        ('["unclosed", "array"', None),
        ('', None),
        ('None', None),
    ]
)
def test_safe_json(input_text, expected_output):
    assert _safe_json(input_text) == expected_output
