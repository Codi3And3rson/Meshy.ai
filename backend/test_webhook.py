import os
import hmac
import hashlib

from fastapi.testclient import TestClient

# Mock the env var before importing main
os.environ["MESHY_WEBHOOK_SECRET"] = "test-secret"

from backend.main import app

client = TestClient(app)


def test_webhook_missing_signature():
    response = client.post("/api/meshy/webhook", json={"task_id": "123"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Missing X-Meshy-Signature header"}


def test_webhook_invalid_signature():
    response = client.post(
        "/api/meshy/webhook",
        json={"task_id": "123"},
        headers={"X-Meshy-Signature": "invalid"},
    )
    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid signature"}


def test_webhook_valid_signature():
    payload = b'{"task_id": "123"}'
    secret = b"test-secret"
    signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    response = client.post(
        "/api/meshy/webhook", content=payload, headers={"X-Meshy-Signature": signature}
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_webhook_valid_signature_with_prefix():
    payload = b'{"task_id": "123"}'
    secret = b"test-secret"
    signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()

    response = client.post(
        "/api/meshy/webhook",
        content=payload,
        headers={"X-Meshy-Signature": f"sha256={signature}"},
    )
    assert response.status_code == 200
    assert response.json() == {"ok": True}


def test_webhook_no_secret_set():
    # Unset the secret
    os.environ["MESHY_WEBHOOK_SECRET"] = ""
    # We need to reload the app to pick up the change since main.py is evaluated on import
    # But since it's hard to un-import, let's just patch the module's variable
    from backend import main

    main.MESHY_WEBHOOK_SECRET = None

    response = client.post("/api/meshy/webhook", json={"task_id": "123"})
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    # Restore for other tests if necessary
    main.MESHY_WEBHOOK_SECRET = "test-secret"
