import pytest
from backend.main import normalize_task

def test_normalize_task_status():
    # Top-level status
    res = normalize_task({"status": "completed"})
    assert res["status"] == "COMPLETED"

    # Nested result status
    res = normalize_task({"result": {"status": "failed"}})
    assert res["status"] == "FAILED"

    # State
    res = normalize_task({"state": "processing"})
    assert res["status"] == "PROCESSING"

    # Fallback to UNKNOWN
    res = normalize_task({})
    assert res["status"] == "UNKNOWN"

    # Precedence: status > result.status > state
    res = normalize_task({"status": "a", "result": {"status": "b"}, "state": "c"})
    assert res["status"] == "A"
    res = normalize_task({"result": {"status": "b"}, "state": "c"})
    assert res["status"] == "B"

def test_normalize_task_model_urls():
    # Top-level model_urls with valid http
    raw = {
        "model_urls": {
            "glb": "http://example.com/model.glb",
            "fbx": "https://example.com/model.fbx",
            "invalid": "http://example.com/invalid", # not in allowed keys
            "obj": "not-http://example.com/model.obj" # invalid schema
        }
    }
    res = normalize_task(raw)
    assert res["model_urls"] == {
        "glb": "http://example.com/model.glb",
        "fbx": "https://example.com/model.fbx"
    }

    # Nested model_urls in result
    raw = {
        "result": {
            "model_urls": {"obj": "http://example.com/model.obj"}
        }
    }
    res = normalize_task(raw)
    assert res["model_urls"] == {"obj": "http://example.com/model.obj"}

    # Nested model_urls in output
    raw = {
        "output": {
            "model_urls": {"usdz": "http://example.com/model.usdz"}
        }
    }
    res = normalize_task(raw)
    assert res["model_urls"] == {"usdz": "http://example.com/model.usdz"}

    # Invalid type for model_urls should be ignored
    res = normalize_task({"model_urls": "invalid-string"})
    assert res["model_urls"] == {}

def test_normalize_task_model_fallback():
    # Preferred order: glb, fbx, obj, usdz, pre_remeshed_glb
    raw = {
        "model_urls": {
            "usdz": "http://example.com/model.usdz",
            "obj": "http://example.com/model.obj"
        }
    }
    res = normalize_task(raw)
    assert res["model"] == {"download_url": "http://example.com/model.obj", "format": "obj"}

    raw = {
        "model_urls": {
            "fbx": "http://example.com/model.fbx",
            "glb": "http://example.com/model.glb"
        }
    }
    res = normalize_task(raw)
    assert res["model"] == {"download_url": "http://example.com/model.glb", "format": "glb"}

    # Older single-url pattern: model_url, glb, gltf
    raw = {"model_url": "http://example.com/old_model.bin"}
    res = normalize_task(raw)
    assert res["model"] == {"download_url": "http://example.com/old_model.bin", "format": "unknown"}

    raw = {"gltf": "http://example.com/old.gltf"}
    res = normalize_task(raw)
    assert res["model"] == {"download_url": "http://example.com/old.gltf", "format": "gltf"}

    raw = {"glb": "http://example.com/old.glb"}
    res = normalize_task(raw)
    assert res["model"] == {"download_url": "http://example.com/old.glb", "format": "glb"}

    # No models at all
    res = normalize_task({})
    assert res["model"] is None

def test_normalize_task_thumbnail():
    # Top-level thumbnail
    raw = {"thumbnail_url": "http://example.com/thumb.png"}
    res = normalize_task(raw)
    assert res["thumbnail_url"] == "http://example.com/thumb.png"

    # Nested result thumbnail
    raw = {"result": {"thumbnail_url": "http://example.com/thumb_res.png"}}
    res = normalize_task(raw)
    assert res["thumbnail_url"] == "http://example.com/thumb_res.png"

    # Nested output thumbnail
    raw = {"output": {"thumbnail_url": "http://example.com/thumb_out.png"}}
    res = normalize_task(raw)
    assert res["thumbnail_url"] == "http://example.com/thumb_out.png"

    # Invalid type for thumbnail
    raw = {"thumbnail_url": 123}
    res = normalize_task(raw)
    assert res["thumbnail_url"] is None

def test_normalize_task_raw():
    raw = {"key": "value", "status": "ok"}
    res = normalize_task(raw)
    assert res["raw"] == raw
