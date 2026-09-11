import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, apiDownload } from "./api/client";

describe("apiClient", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("apiFetch appends API key header when provided", async () => {
    const mockData = { ok: true };
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      text: async () => JSON.stringify(mockData),
    });

    const result = await apiFetch("/api/health", { apiKey: "test_key_123" });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/health"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Meshy-Key": "test_key_123",
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it("apiDownload routes remote assets through download proxy", async () => {
    const mockBlob = new Blob(["test"]);
    globalThis.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    });

    const remoteUrl = "https://assets.meshy.ai/tasks/123/model.glb";
    const res = await apiDownload(remoteUrl);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/download?url=${encodeURIComponent(remoteUrl)}`)
    );
    expect(res).toBe(mockBlob);
  });
});
