import pytest
from main import normalize_task

def test_normalize_task_status_normalization():
    # Default to UNKNOWN
    assert normalize_task({})["status"] == "UNKNOWN"

    # Read from top-level status
    assert normalize_task({"status": "pending"})["status"] == "PENDING"
    assert normalize_task({"status": "SUCCESS"})["status"] == "SUCCESS"

    # Read from nested result.status
    assert normalize_task({"result": {"status": "failed"}})["status"] == "FAILED"

    # Read from top-level state
    assert normalize_task({"state": "processing"})["status"] == "PROCESSING"

    # Prioritize top-level status over others
    assert normalize_task({"status": "done", "result": {"status": "pending"}})["status"] == "DONE"

    # Prioritize result.status over state
    assert normalize_task({"result": {"status": "done"}, "state": "pending"})["status"] == "DONE"

    # Ensure uppercase conversion for non-string types
    assert normalize_task({"status": 123})["status"] == "123"

def test_normalize_task_model_urls_extraction():
    # Empty case
    assert normalize_task({})["model_urls"] == {}

    # Top-level model_urls extraction
    raw = {
        "model_urls": {
            "glb": "https://example.com/model.glb",
            "fbx": "http://example.com/model.fbx",
            "obj": "invalid-url",
            "usdz": 123,
            "ignored_key": "https://example.com/ignored.glb"
        }
    }
    expected = {
        "glb": "https://example.com/model.glb",
        "fbx": "http://example.com/model.fbx"
    }
    assert normalize_task(raw)["model_urls"] == expected

    # model_urls ignored if not dict
    assert normalize_task({"model_urls": "invalid"})["model_urls"] == {}

    # Nested in result
    raw_result = {"result": {"model_urls": {"glb": "http://example.com/nested.glb"}}}
    assert normalize_task(raw_result)["model_urls"] == {"glb": "http://example.com/nested.glb"}

    # Nested in output
    raw_output = {"output": {"model_urls": {"fbx": "http://example.com/nested.fbx"}}}
    assert normalize_task(raw_output)["model_urls"] == {"fbx": "http://example.com/nested.fbx"}

def test_normalize_task_model_selection():
    # Preferred order: glb > fbx > obj > usdz > pre_remeshed_glb
    raw_all = {
        "model_urls": {
            "glb": "http://example.com/1.glb",
            "fbx": "http://example.com/2.fbx",
            "obj": "http://example.com/3.obj",
            "usdz": "http://example.com/4.usdz",
            "pre_remeshed_glb": "http://example.com/5.glb"
        }
    }
    # Should pick glb
    assert normalize_task(raw_all)["model"] == {"download_url": "http://example.com/1.glb", "format": "glb"}

    # Should pick obj if glb and fbx missing
    raw_obj = {
        "model_urls": {
            "obj": "http://example.com/3.obj",
            "usdz": "http://example.com/4.usdz"
        }
    }
    assert normalize_task(raw_obj)["model"] == {"download_url": "http://example.com/3.obj", "format": "obj"}

    # Single-url fallback: model_url
    assert normalize_task({"model_url": "http://example.com/fallback"})["model"] == {"download_url": "http://example.com/fallback", "format": "unknown"}

    # Single-url fallback: glb
    assert normalize_task({"glb": "http://example.com/fallback.glb"})["model"] == {"download_url": "http://example.com/fallback.glb", "format": "glb"}

    # Single-url fallback: gltf
    assert normalize_task({"gltf": "http://example.com/fallback.gltf"})["model"] == {"download_url": "http://example.com/fallback.gltf", "format": "gltf"}

    # Ignore fallback if it doesn't start with http
    assert normalize_task({"model_url": "invalid"})["model"] is None

    # Priority of fallbacks: model_url > glb > gltf
    raw_fallbacks = {
        "model_url": "http://example.com/model_url",
        "glb": "http://example.com/glb"
    }
    assert normalize_task(raw_fallbacks)["model"] == {"download_url": "http://example.com/model_url", "format": "unknown"}

    # No model info
    assert normalize_task({})["model"] is None

def test_normalize_task_thumbnail_url():
    # Empty case
    assert normalize_task({})["thumbnail_url"] is None

    # Top-level thumbnail_url
    assert normalize_task({"thumbnail_url": "http://example.com/thumb.jpg"})["thumbnail_url"] == "http://example.com/thumb.jpg"

    # Ignore top-level if not starting with http
    assert normalize_task({"thumbnail_url": "invalid"})["thumbnail_url"] is None
    assert normalize_task({"thumbnail_url": 123})["thumbnail_url"] is None

    # Nested in result
    assert normalize_task({"result": {"thumbnail_url": "http://example.com/result_thumb.jpg"}})["thumbnail_url"] == "http://example.com/result_thumb.jpg"

    # Nested in output
    assert normalize_task({"output": {"thumbnail_url": "http://example.com/output_thumb.jpg"}})["thumbnail_url"] == "http://example.com/output_thumb.jpg"

    # Priority: top-level > result > output
    raw_priority = {
        "thumbnail_url": "http://example.com/top.jpg",
        "result": {"thumbnail_url": "http://example.com/res.jpg"}
    }
    assert normalize_task(raw_priority)["thumbnail_url"] == "http://example.com/top.jpg"

    raw_priority_2 = {
        "thumbnail_url": "invalid",
        "result": {"thumbnail_url": "http://example.com/res.jpg"},
        "output": {"thumbnail_url": "http://example.com/out.jpg"}
    }
    assert normalize_task(raw_priority_2)["thumbnail_url"] == "http://example.com/res.jpg"

    # Ignore invalid nested
    raw_invalid_nested = {
        "result": {"thumbnail_url": "invalid"},
        "output": {"thumbnail_url": "http://example.com/valid.jpg"}
    }
    assert normalize_task(raw_invalid_nested)["thumbnail_url"] == "http://example.com/valid.jpg"

    # Keep original raw structure
    original = {"status": "success", "thumbnail_url": "http://example.com/thumb.jpg"}
    assert normalize_task(original)["raw"] == original
