// client.js
const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8010";

export function pickErrorMessage(data, fallback) {
    if (!data) return fallback;

    // FastAPI-style
    if (data.detail) {
        return typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail);
    }

    // Common API styles
    if (typeof data.message === "string") return data.message;
    if (typeof data.error === "string") return data.error;

    // Anything else
    try {
        return JSON.stringify(data);
    } catch {
        return fallback;
    }
}

export async function apiFetch(path, { apiKey, method = "GET", body, headers } = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(apiKey ? { "X-Meshy-Key": apiKey } : {}),
            ...(headers || {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let data = null;

    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = { raw: text };
        }
    }

    if (!res.ok) {
        const fallback = `HTTP ${res.status}`;
        throw new Error(pickErrorMessage(data, fallback));
    }

    return data;
}

export async function apiDownload(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    return await res.blob();
}
