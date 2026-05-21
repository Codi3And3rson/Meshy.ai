from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_webhook_no_log_sensitive_data(capsys):
    payload = b'{"secret_key": "very_sensitive", "task_id": "123"}'
    response = client.post("/api/meshy/webhook", content=payload)
    assert response.status_code == 200
    assert response.json() == {"ok": True}

    captured = capsys.readouterr()
    assert "very_sensitive" not in captured.out
    assert "secret_key" not in captured.out
