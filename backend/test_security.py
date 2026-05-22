import os
import pytest
import importlib

def test_meshy_base_validation(monkeypatch):
    monkeypatch.setenv("MESHY_BASE", "https://attacker.com")
    with pytest.raises(ValueError, match="Untrusted MESHY_BASE host"):
        import backend.main
        importlib.reload(backend.main)

def test_meshy_base_valid(monkeypatch):
    monkeypatch.setenv("MESHY_BASE", "https://api.meshy.ai")
    import backend.main
    importlib.reload(backend.main)
    assert backend.main.MESHY_BASE == "https://api.meshy.ai"

    monkeypatch.setenv("MESHY_BASE", "http://localhost:8080")
    importlib.reload(backend.main)
    assert backend.main.MESHY_BASE == "http://localhost:8080"
