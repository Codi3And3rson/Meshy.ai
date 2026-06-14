import pytest
from fastapi.testclient import TestClient
import hmac
import hashlib
from unittest.mock import patch
import json

from backend.main import app

client = TestClient(app)

def test_webhook_no_secret():
    """Test webhook when MESHY_WEBHOOK_SECRET is not set"""
    with patch("backend.main.MESHY_WEBHOOK_SECRET", None):
        response = client.post("/api/meshy/webhook", json={"task_id": "test_123", "status": "SUCCEEDED"})
        assert response.status_code == 200
        assert response.json() == {"ok": True}

def test_webhook_with_secret_missing_signature():
    """Test webhook fails when signature header is missing but secret is set"""
    with patch("backend.main.MESHY_WEBHOOK_SECRET", "my_test_secret"):
        response = client.post("/api/meshy/webhook", json={"task_id": "test_123"})
        assert response.status_code == 401
        assert response.json()["detail"] == "Missing X-Meshy-Signature header"

def test_webhook_with_secret_invalid_signature():
    """Test webhook fails with incorrect signature"""
    with patch("backend.main.MESHY_WEBHOOK_SECRET", "my_test_secret"):
        response = client.post(
            "/api/meshy/webhook",
            json={"task_id": "test_123"},
            headers={"X-Meshy-Signature": "invalid_signature"}
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid X-Meshy-Signature"

def test_webhook_with_secret_valid_signature():
    """Test webhook succeeds with valid signature"""
    secret = "my_test_secret"
    payload = {"task_id": "test_123"}
    payload_bytes = json.dumps(payload).encode("utf-8")

    # Calculate the valid signature
    valid_signature = hmac.new(
        secret.encode("utf-8"),
        payload_bytes,
        hashlib.sha256
    ).hexdigest()

    with patch("backend.main.MESHY_WEBHOOK_SECRET", secret):
        # We need to pass the raw body we signed to ensure it matches exactly
        response = client.post(
            "/api/meshy/webhook",
            content=payload_bytes,
            headers={"X-Meshy-Signature": valid_signature, "Content-Type": "application/json"}
        )
        assert response.status_code == 200
        assert response.json() == {"ok": True}
