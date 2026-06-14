# main.py (patched + download proxy)
from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
from typing import Any

from dotenv import load_dotenv
load_dotenv()
from urllib.parse import urlparse, unquote

import httpx
from fastapi import FastAPI, Header, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# Meshy API base URL (docs use https://api.meshy.ai)
MESHY_BASE = os.getenv("MESHY_BASE", "https://api.meshy.ai").rstrip("/")

# Optional: set a server-side Meshy API key so you *don't* need to send keys from the browser
# If provided, backend will always use this key (recommended for production).
SERVER_MESHY_API_KEY = os.getenv("MESHY_API_KEY", "").strip() or None

# Webhook security
# If provided, the webhook endpoint will verify the X-Meshy-Signature header using HMAC SHA-256
MESHY_WEBHOOK_SECRET = os.getenv("MESHY_WEBHOOK_SECRET", "").strip() or None

# Networking
HTTP_TIMEOUT_SECONDS = float(os.getenv("HTTP_TIMEOUT_SECONDS", "60"))

# Retry/backoff
# IMPORTANT: Retrying POST on HTTP 429/5xx can create duplicate tasks.
# We only retry GET/HEAD/OPTIONS on 429/5xx; for POST we retry only on network errors/timeouts.
MAX_RETRIES = int(os.getenv("MESHY_MAX_RETRIES", "3"))
RETRY_BASE_DELAY_SECONDS = float(os.getenv("MESHY_RETRY_BASE_DELAY_SECONDS", "0.6"))

# Asset retention notice (docs: non-enterprise assets retained max ~3 days)
ASSET_RETENTION_DAYS = 3  # informational only

# Limit data: URLs (base64) coming from the browser to avoid huge payloads
MAX_DATA_URL_CHARS = int(os.getenv("MAX_DATA_URL_CHARS", "8000000"))  # ~8M chars

# Download proxy limits/safety
MAX_DOWNLOAD_BYTES = int(os.getenv("MAX_DOWNLOAD_BYTES", str(1024 * 1024 * 1024)))  # 1GB default
ALLOWED_DOWNLOAD_HOSTS = [
    h.strip().lower()
    for h in os.getenv("ALLOWED_DOWNLOAD_HOSTS", "assets.meshy.ai").split(",")
    if h.strip()
]

# CORS
DEFAULT_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
ALLOW_ORIGINS = [
    o.strip()
    for o in os.getenv("CORS_ALLOW_ORIGINS", ",".join(DEFAULT_ORIGINS)).split(",")
    if o.strip()
]


# ---------- Helpers ----------
def _safe_json(text: str) -> Any:
    try:
        return json.loads(text)
    except Exception:
        return None


def _http_error_from_meshy(resp: httpx.Response) -> HTTPException:
    """
    Meshy errors typically return JSON like {"message": "..."}.
    Preserve parsed JSON and raw body for easier debugging.
    """
    body_text = resp.text
    try:
        parsed = resp.json()
    except Exception:
        parsed = _safe_json(body_text)

    if isinstance(parsed, dict) and "message" in parsed:
        detail: Any = {"message": parsed.get("message"), "raw": parsed}
    elif parsed is not None:
        detail = {"raw": parsed}
    else:
        detail = {"raw": body_text}

    return HTTPException(status_code=resp.status_code, detail=detail)


def _extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    a = authorization.strip()
    if not a:
        return None
    # Allow either "Bearer <token>" or raw token (some callers send only token)
    if a.lower().startswith("bearer "):
        tok = a.split(" ", 1)[1].strip()
        return tok or None
    return a


def _require_api_key(x_meshy_key: str | None, authorization: str | None) -> str:
    """
    Priority:
      1) SERVER_MESHY_API_KEY (if set)
      2) Authorization: Bearer <key> (if provided by caller)
      3) X-Meshy-Key (dev/local)
    """
    if SERVER_MESHY_API_KEY:
        return SERVER_MESHY_API_KEY

    bearer = _extract_bearer_token(authorization)
    if bearer:
        return bearer

    if not x_meshy_key or not x_meshy_key.strip():
        raise HTTPException(
            status_code=401,
            detail=(
                "Missing API key. Provide it in the X-Meshy-Key header (dev) "
                "or set MESHY_API_KEY on the server (prod)."
            ),
        )
    return x_meshy_key.strip()


def _meshy_headers(api_key: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {api_key}"}


def _filename_from_url(url: str, fallback: str = "download.bin") -> str:
    try:
        path = urlparse(url).path or ""
        name = path.split("/")[-1].strip() or fallback
        return unquote(name)
    except Exception:
        return fallback


def _validate_download_url(url: str) -> None:
    """
    Basic SSRF guard:
      - must be http/https
      - host must be allowed
    """
    try:
        u = urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid download URL")

    if u.scheme not in ("http", "https"):
        raise HTTPException(status_code=400, detail="Download URL must be http/https")

    host = (u.hostname or "").lower()
    if not host:
        raise HTTPException(status_code=400, detail="Download URL missing host")

    # allow exact host or subdomains of allowed hosts
    ok = False
    for allowed in ALLOWED_DOWNLOAD_HOSTS:
        if host == allowed or host.endswith("." + allowed):
            ok = True
            break
    if not ok:
        raise HTTPException(
            status_code=403,
            detail=f"Download host not allowed: {host}. Allowed: {ALLOWED_DOWNLOAD_HOSTS}",
        )


def normalize_task(raw: dict) -> dict:
    """
    Normalize task responses so the frontend can reliably find model download URLs.

    Adds:
      - status (UPPERCASE)
      - model: { download_url, format } (best-effort default)
      - model_urls: { glb, fbx, obj, usdz, mtl, pre_remeshed_glb } (when present)
      - thumbnail_url (when present; checks nested result/output too)
      - raw (original task payload)
    """
    status = raw.get("status") or raw.get("result", {}).get("status") or raw.get("state") or "UNKNOWN"
    status = str(status).upper()

    def pick_model_urls(d: dict) -> dict[str, str]:
        mu = d.get("model_urls")
        if not isinstance(mu, dict):
            return {}
        keys = ["glb", "fbx", "obj", "usdz", "mtl", "pre_remeshed_glb"]
        out: dict[str, str] = {}
        for k in keys:
            v = mu.get(k)
            if isinstance(v, str) and v.startswith("http"):
                out[k] = v
        return out

    model_urls = pick_model_urls(raw)
    if not model_urls:
        for nest in ("result", "output"):
            d = raw.get(nest)
            if isinstance(d, dict):
                model_urls = pick_model_urls(d)
                if model_urls:
                    break

    # Choose a default download url preference order
    preferred_order = ["glb", "fbx", "obj", "usdz", "pre_remeshed_glb"]
    model = None
    for fmt in preferred_order:
        url = model_urls.get(fmt)
        if url:
            model = {"download_url": url, "format": fmt}
            break

    # Older/common single-url patterns (fallback)
    if model is None:
        for key, fmt in (("model_url", "unknown"), ("glb", "glb"), ("gltf", "gltf")):
            v = raw.get(key)
            if isinstance(v, str) and v.startswith("http"):
                model = {"download_url": v, "format": fmt}
                break

    # thumbnail can appear in top-level, result, or output
    thumb = raw.get("thumbnail_url")
    if not (isinstance(thumb, str) and thumb.startswith("http")):
        thumb = None
        for nest in ("result", "output"):
            d = raw.get(nest)
            if isinstance(d, dict):
                t2 = d.get("thumbnail_url")
                if isinstance(t2, str) and t2.startswith("http"):
                    thumb = t2
                    break

    return {
        "status": status,
        "model": model,            # can be None until ready
        "model_urls": model_urls,  # {} until ready
        "thumbnail_url": thumb,
        "raw": raw,
    }


async def _request_with_retries(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    headers: dict[str, str],
    json_body: Any | None = None,
) -> httpx.Response:
    """
    Safer retry policy:
      - Always retry network errors/timeouts (up to MAX_RETRIES)
      - Retry HTTP 429/5xx only for idempotent methods (GET/HEAD/OPTIONS)

    This avoids accidentally creating duplicate tasks by retrying POST.
    """
    method_u = method.upper()
    idempotent = method_u in ("GET", "HEAD", "OPTIONS")

    attempt = 0
    while True:
        try:
            resp = await client.request(method_u, url, headers=headers, json=json_body)

            if idempotent and resp.status_code in (429, 500, 502, 503, 504) and attempt < MAX_RETRIES:
                delay = (RETRY_BASE_DELAY_SECONDS * (2 ** attempt)) + (0.05 * attempt)
                attempt += 1
                await asyncio.sleep(delay)
                continue

            return resp

        except (httpx.TimeoutException, httpx.TransportError) as exc:
            if attempt < MAX_RETRIES:
                delay = (RETRY_BASE_DELAY_SECONDS * (2 ** attempt)) + (0.05 * attempt)
                attempt += 1
                await asyncio.sleep(delay)
                continue
            raise HTTPException(status_code=502, detail=f"Upstream network error talking to Meshy: {exc!s}") from exc


# ---------- Request Models ----------
class TextTo3DRequest(BaseModel):
    # Docs: mode=preview OR refine
    mode: str = Field(..., pattern="^(preview|refine)$")

    # preview fields
    prompt: str | None = Field(default=None, min_length=1, max_length=600)
    negative_prompt: str | None = Field(default=None, max_length=600)
    art_style: str | None = None
    ai_model: str | None = None
    topology: str | None = None
    target_polycount: int | None = Field(default=None, ge=100, le=300_000)
    should_remesh: bool | None = None
    symmetry_mode: str | None = None
    pose_mode: str | None = None
    moderation: bool | None = None

    # refine fields
    preview_task_id: str | None = None
    enable_pbr: bool | None = None
    texture_prompt: str | None = Field(default=None, max_length=600)
    texture_image_url: str | None = None  # public URL or data URI


class ImageTo3DRequest(BaseModel):
    image_url: str = Field(..., min_length=1)
    model_type: str | None = None
    ai_model: str | None = None
    topology: str | None = None
    target_polycount: int | None = Field(default=None, ge=100, le=300_000)
    symmetry_mode: str | None = None
    should_remesh: bool | None = None
    save_pre_remeshed_model: bool | None = None
    should_texture: bool | None = None
    enable_pbr: bool | None = None
    pose_mode: str | None = None
    texture_prompt: str | None = Field(default=None, max_length=600)
    texture_image_url: str | None = None
    moderation: bool | None = None


# ---------- App ----------
app = FastAPI(title="Meshy Proxy API", version="2.1.0")


@app.on_event("startup")
async def _startup() -> None:
    app.state.http = httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS)
    # Separate client for streaming downloads (no global timeout; we rely on MAX_DOWNLOAD_BYTES)
    app.state.http_stream = httpx.AsyncClient(timeout=None)


@app.on_event("shutdown")
async def _shutdown() -> None:
    c1: httpx.AsyncClient | None = getattr(app.state, "http", None)
    c2: httpx.AsyncClient | None = getattr(app.state, "http_stream", None)
    if c1 is not None:
        await c1.aclose()
    if c2 is not None:
        await c2.aclose()


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# ---------- Routes ----------
@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "meshy_base": MESHY_BASE,
        "using_server_key": bool(SERVER_MESHY_API_KEY),
        "asset_retention_note": (
            f"Meshy API assets may expire after ~{ASSET_RETENTION_DAYS} days unless enterprise. "
            "Download outputs promptly."
        ),
        "max_data_url_chars": MAX_DATA_URL_CHARS,
        "allowed_download_hosts": ALLOWED_DOWNLOAD_HOSTS,
        "max_download_bytes": MAX_DOWNLOAD_BYTES,
    }


# Optional but super useful for verifying key + credits
@app.get("/api/balance")
async def balance(
    x_meshy_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    api_key = _require_api_key(x_meshy_key, authorization)
    client: httpx.AsyncClient = app.state.http

    resp = await _request_with_retries(
        client,
        "GET",
        f"{MESHY_BASE}/openapi/v1/balance",
        headers=_meshy_headers(api_key),
    )
    if resp.status_code >= 400:
        raise _http_error_from_meshy(resp)
    return resp.json()


# --- Download Proxy (fixes browser CORS "Failed to fetch") ---
@app.get("/api/download")
async def download_proxy(
    url: str = Query(..., min_length=10),
    filename: str | None = Query(default=None),
):
    """
    Streams a remote asset back to the browser from *this* origin.
    This avoids CORS problems when the frontend tries to fetch Meshy signed URLs.

    Security:
      - Only allows hosts in ALLOWED_DOWNLOAD_HOSTS (default: assets.meshy.ai)
      - Enforces MAX_DOWNLOAD_BYTES to prevent abuse
    """
    _validate_download_url(url)

    client: httpx.AsyncClient = app.state.http_stream

    try:
        upstream = await client.stream("GET", url, headers={"Accept": "*/*"})
    except (httpx.TimeoutException, httpx.TransportError) as exc:
        raise HTTPException(status_code=502, detail=f"Upstream download error: {exc!s}") from exc

    # If upstream errors, surface readable detail
    if upstream.status_code >= 400:
        # read a small amount for error reporting
        body = await upstream.aread()
        text = body[:2000].decode("utf-8", errors="replace")
        await upstream.aclose()
        raise HTTPException(status_code=upstream.status_code, detail={"message": "Upstream error", "raw": text})

    # Content metadata
    content_type = upstream.headers.get("content-type") or "application/octet-stream"
    content_length = upstream.headers.get("content-length")
    if content_length is not None:
        try:
            n = int(content_length)
            if n > MAX_DOWNLOAD_BYTES:
                await upstream.aclose()
                raise HTTPException(status_code=413, detail=f"File too large ({n} bytes). Max is {MAX_DOWNLOAD_BYTES}.")
        except ValueError:
            pass

    out_name = (filename or "").strip() or _filename_from_url(url, "download.bin")

    # Stream with size guard
    async def iter_bytes():
        total = 0
        async for chunk in upstream.aiter_bytes(chunk_size=1024 * 1024):
            if not chunk:
                continue
            total += len(chunk)
            if total > MAX_DOWNLOAD_BYTES:
                await upstream.aclose()
                raise HTTPException(status_code=413, detail=f"File exceeded max size ({MAX_DOWNLOAD_BYTES} bytes).")
            yield chunk
        await upstream.aclose()

    headers = {
        "Content-Disposition": f'attachment; filename="{out_name}"',
        # helps caches/proxies behave; these Meshy URLs are signed/expiring anyway
        "Cache-Control": "no-store",
    }

    return StreamingResponse(iter_bytes(), media_type=content_type, headers=headers)


# --- Text to 3D (preview + refine) ---
@app.post("/api/text-to-3d")
async def create_text_to_3d(
    body: TextTo3DRequest,
    x_meshy_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    api_key = _require_api_key(x_meshy_key, authorization)

    if body.mode == "preview":
        if not body.prompt:
            raise HTTPException(status_code=422, detail="prompt is required when mode=preview")
    else:
        if not body.preview_task_id:
            raise HTTPException(status_code=422, detail="preview_task_id is required when mode=refine")

    payload: dict[str, Any] = {"mode": body.mode}

    for k in (
        "prompt",
        "negative_prompt",
        "art_style",
        "ai_model",
        "topology",
        "target_polycount",
        "should_remesh",
        "symmetry_mode",
        "pose_mode",
        "moderation",
        "preview_task_id",
        "enable_pbr",
        "texture_prompt",
        "texture_image_url",
    ):
        v = getattr(body, k)
        if v is not None:
            payload[k] = v

    client: httpx.AsyncClient = app.state.http
    resp = await _request_with_retries(
        client,
        "POST",
        f"{MESHY_BASE}/openapi/v2/text-to-3d",
        headers=_meshy_headers(api_key),
        json_body=payload,
    )
    if resp.status_code >= 400:
        raise _http_error_from_meshy(resp)

    data = resp.json()
    task_id = data.get("result") or data.get("id") or data.get("task_id")
    if not task_id:
        return {"result": None, "raw": data}
    return {"result": task_id}


# Backwards-compatible endpoint your frontend may already call
class TextTo3DPreviewLegacyRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=600)
    negative_prompt: str | None = Field(default=None, max_length=600)
    art_style: str | None = None
    should_remesh: bool | None = None


@app.post("/api/text-to-3d/preview")
async def create_text_to_3d_preview(
    body: TextTo3DPreviewLegacyRequest,
    x_meshy_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    d = body.model_dump(exclude_none=True)
    req = TextTo3DRequest(mode="preview", **d)
    return await create_text_to_3d(req, x_meshy_key, authorization)


@app.get("/api/text-to-3d/{task_id}")
async def get_text_to_3d_task(
    task_id: str,
    x_meshy_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    api_key = _require_api_key(x_meshy_key, authorization)
    client: httpx.AsyncClient = app.state.http

    resp = await _request_with_retries(
        client,
        "GET",
        f"{MESHY_BASE}/openapi/v2/text-to-3d/{task_id}",
        headers=_meshy_headers(api_key),
    )
    if resp.status_code >= 400:
        raise _http_error_from_meshy(resp)

    return normalize_task(resp.json())


# --- Image to 3D ---
@app.post("/api/image-to-3d")
async def create_image_to_3d(
    body: ImageTo3DRequest,
    x_meshy_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    api_key = _require_api_key(x_meshy_key, authorization)

    # Guard extremely large base64 payloads
    if body.image_url.startswith("data:") and len(body.image_url) > MAX_DATA_URL_CHARS:
        raise HTTPException(
            status_code=413,
            detail=(
                f"image_url data URI too large ({len(body.image_url)} chars). "
                f"Max allowed is {MAX_DATA_URL_CHARS}. Use a smaller image or host it and pass a public URL."
            ),
        )

    payload: dict[str, Any] = {"image_url": body.image_url}

    for k in (
        "model_type",
        "ai_model",
        "topology",
        "target_polycount",
        "symmetry_mode",
        "should_remesh",
        "save_pre_remeshed_model",
        "should_texture",
        "enable_pbr",
        "pose_mode",
        "texture_prompt",
        "texture_image_url",
        "moderation",
    ):
        v = getattr(body, k)
        if v is not None:
            payload[k] = v

    client: httpx.AsyncClient = app.state.http
    resp = await _request_with_retries(
        client,
        "POST",
        f"{MESHY_BASE}/openapi/v1/image-to-3d",
        headers=_meshy_headers(api_key),
        json_body=payload,
    )
    if resp.status_code >= 400:
        raise _http_error_from_meshy(resp)

    data = resp.json()
    task_id = data.get("result") or data.get("id") or data.get("task_id")
    if not task_id:
        return {"result": None, "raw": data}
    return {"result": task_id}


@app.get("/api/image-to-3d/{task_id}")
async def get_image_to_3d_task(
    task_id: str,
    x_meshy_key: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
):
    api_key = _require_api_key(x_meshy_key, authorization)
    client: httpx.AsyncClient = app.state.http

    resp = await _request_with_retries(
        client,
        "GET",
        f"{MESHY_BASE}/openapi/v1/image-to-3d/{task_id}",
        headers=_meshy_headers(api_key),
    )
    if resp.status_code >= 400:
        raise _http_error_from_meshy(resp)

    return normalize_task(resp.json())


# --- Webhook receiver (optional) ---
@app.post("/api/meshy/webhook")
async def meshy_webhook(request: Request, x_meshy_signature: str | None = Header(default=None)):
    """
    Meshy can POST task objects to your webhook URL when statuses change.
    This endpoint simply acknowledges receipt and returns <400 to prevent auto-disable.
    """
    raw_body = await request.body()

    if MESHY_WEBHOOK_SECRET:
        if not x_meshy_signature:
            raise HTTPException(status_code=401, detail="Missing X-Meshy-Signature header")

        expected_signature = hmac.new(
            MESHY_WEBHOOK_SECRET.encode("utf-8"),
            raw_body,
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, x_meshy_signature):
            raise HTTPException(status_code=401, detail="Invalid X-Meshy-Signature")

    try:
        payload = json.loads(raw_body)
    except Exception:
        payload = raw_body.decode("utf-8", errors="replace")

    print("[meshy-webhook]", payload)
    return {"ok": True}


@app.get("/api/retention")
async def retention_info():
    return {
        "note": "Meshy API-generated assets are retained for a limited time unless enterprise. Download and store outputs promptly.",
        "max_days_non_enterprise": ASSET_RETENTION_DAYS,
    }
