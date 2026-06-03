import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from backend.main import app
import httpx
import os

@pytest.fixture(autouse=True)
def mock_env():
    with patch.dict(os.environ, {"MESHY_API_KEY": ""}, clear=True):
        # We also need to patch backend.main.SERVER_MESHY_API_KEY since it's evaluated at import time
        with patch("backend.main.SERVER_MESHY_API_KEY", None):
            yield

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

def mock_response(status_code: int, json_data: dict) -> httpx.Response:
    return httpx.Response(status_code=status_code, json=json_data, request=httpx.Request("POST", "https://api.meshy.ai/openapi/v2/text-to-3d"))

@patch("backend.main._request_with_retries")
def test_create_text_to_3d_preview_happy_path(mock_request, client):
    mock_request.return_value = mock_response(200, {"result": "task-id-123"})

    response = client.post(
        "/api/text-to-3d",
        headers={"x-meshy-key": "test-key"},
        json={"mode": "preview", "prompt": "a cute cat"}
    )

    assert response.status_code == 200
    assert response.json() == {"result": "task-id-123"}

    mock_request.assert_called_once()
    kwargs = mock_request.call_args.kwargs
    assert kwargs["json_body"] == {"mode": "preview", "prompt": "a cute cat"}
    assert kwargs["headers"]["Authorization"] == "Bearer test-key"

def test_create_text_to_3d_preview_missing_prompt(client):
    response = client.post(
        "/api/text-to-3d",
        headers={"x-meshy-key": "test-key"},
        json={"mode": "preview"}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "prompt is required when mode=preview"

@patch("backend.main._request_with_retries")
def test_create_text_to_3d_refine_happy_path(mock_request, client):
    mock_request.return_value = mock_response(200, {"result": "task-id-456"})

    response = client.post(
        "/api/text-to-3d",
        headers={"x-meshy-key": "test-key"},
        json={"mode": "refine", "preview_task_id": "preview-id-123", "enable_pbr": True}
    )

    assert response.status_code == 200
    assert response.json() == {"result": "task-id-456"}

    mock_request.assert_called_once()
    kwargs = mock_request.call_args.kwargs
    assert kwargs["json_body"] == {"mode": "refine", "preview_task_id": "preview-id-123", "enable_pbr": True}

def test_create_text_to_3d_refine_missing_preview_task_id(client):
    response = client.post(
        "/api/text-to-3d",
        headers={"x-meshy-key": "test-key"},
        json={"mode": "refine"}
    )

    assert response.status_code == 422
    assert response.json()["detail"] == "preview_task_id is required when mode=refine"

def test_create_text_to_3d_missing_auth(client):
    response = client.post(
        "/api/text-to-3d",
        json={"mode": "preview", "prompt": "a cute cat"}
    )

    assert response.status_code == 401
    assert "Missing API key" in response.json()["detail"]

@patch("backend.main._request_with_retries")
def test_create_text_to_3d_meshy_error(mock_request, client):
    mock_request.return_value = mock_response(400, {"message": "Bad Request from Meshy"})

    response = client.post(
        "/api/text-to-3d",
        headers={"x-meshy-key": "test-key"},
        json={"mode": "preview", "prompt": "a cute cat"}
    )

    assert response.status_code == 400
    assert response.json()["detail"]["message"] == "Bad Request from Meshy"
