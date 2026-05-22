import test from "node:test";
import assert from "node:assert";
import { apiFetch } from "./client.js";

test("apiFetch handles non-JSON text response correctly", async () => {
    const originalFetch = globalThis.fetch;
    const mockText = "<html>Not a JSON string</html>";

    globalThis.fetch = async (url, options) => {
        return {
            ok: true,
            text: async () => mockText,
        };
    };

    try {
        const data = await apiFetch("/some-path");
        assert.deepStrictEqual(data, { raw: mockText });
    } finally {
        globalThis.fetch = originalFetch;
    }
});
