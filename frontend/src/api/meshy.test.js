import { describe, it, mock } from "node:test";
import assert from "node:assert";

const mockApiFetch = mock.fn(async () => ({ success: true }));

mock.module("./client.js", {
    namedExports: {
        apiFetch: mockApiFetch,
        apiDownload: mock.fn()
    }
});

const { meshy } = await import("./meshy.js");

describe("meshy API client", () => {
    it("createTextTo3D should call apiFetch with correct parameters", async () => {
        mockApiFetch.mock.resetCalls();

        const apiKey = "test-api-key";
        const payload = { mode: "preview", prompt: "a red dragon", art_style: "realistic" };

        await meshy.createTextTo3D(apiKey, payload);

        assert.strictEqual(mockApiFetch.mock.calls.length, 1);
        const callArgs = mockApiFetch.mock.calls[0].arguments;

        assert.strictEqual(callArgs[0], "/api/text-to-3d");
        assert.deepStrictEqual(callArgs[1], {
            apiKey: "test-api-key",
            method: "POST",
            body: payload
        });
    });

    it("createTextPreview should call apiFetch with correct parameters", async () => {
        mockApiFetch.mock.resetCalls();

        const apiKey = "test-api-key-2";
        const payload = { prompt: "a blue dragon", art_style: "voxel" };

        await meshy.createTextPreview(apiKey, payload);

        assert.strictEqual(mockApiFetch.mock.calls.length, 1);
        const callArgs = mockApiFetch.mock.calls[0].arguments;

        assert.strictEqual(callArgs[0], "/api/text-to-3d/preview");
        assert.deepStrictEqual(callArgs[1], {
            apiKey: "test-api-key-2",
            method: "POST",
            body: payload
        });
    });

    it("refineText should call apiFetch with correct parameters", async () => {
        mockApiFetch.mock.resetCalls();

        const apiKey = "test-api-key-3";
        const taskId = "task-123";
        const payload = { texture_prompt: "gold" };

        await meshy.refineText(apiKey, taskId, payload);

        assert.strictEqual(mockApiFetch.mock.calls.length, 1);
        const callArgs = mockApiFetch.mock.calls[0].arguments;

        assert.strictEqual(callArgs[0], "/api/text-to-3d");
        assert.deepStrictEqual(callArgs[1], {
            apiKey: "test-api-key-3",
            method: "POST",
            body: {
                mode: "refine",
                preview_task_id: taskId,
                texture_prompt: "gold"
            }
        });
    });

    it("getTextTask should call apiFetch with correct parameters", async () => {
        mockApiFetch.mock.resetCalls();

        const apiKey = "test-api-key-4";
        const taskId = "task-456";

        await meshy.getTextTask(apiKey, taskId);

        assert.strictEqual(mockApiFetch.mock.calls.length, 1);
        const callArgs = mockApiFetch.mock.calls[0].arguments;

        assert.strictEqual(callArgs[0], `/api/text-to-3d/${taskId}`);
        assert.deepStrictEqual(callArgs[1], {
            apiKey: "test-api-key-4"
        });
    });

    it("createImageTo3D should call apiFetch with correct parameters", async () => {
        mockApiFetch.mock.resetCalls();

        const apiKey = "img-api-key";
        const payload = { image_url: "http://example.com/img.png" };

        await meshy.createImageTo3D(apiKey, payload);

        assert.strictEqual(mockApiFetch.mock.calls.length, 1);
        const callArgs = mockApiFetch.mock.calls[0].arguments;

        assert.strictEqual(callArgs[0], "/api/image-to-3d");
        assert.deepStrictEqual(callArgs[1], {
            apiKey: "img-api-key",
            method: "POST",
            body: payload
        });
    });

    it("getImageTask should call apiFetch with correct parameters", async () => {
        mockApiFetch.mock.resetCalls();

        const apiKey = "img-api-key-2";
        const taskId = "img-task-789";

        await meshy.getImageTask(apiKey, taskId);

        assert.strictEqual(mockApiFetch.mock.calls.length, 1);
        const callArgs = mockApiFetch.mock.calls[0].arguments;

        assert.strictEqual(callArgs[0], `/api/image-to-3d/${taskId}`);
        assert.deepStrictEqual(callArgs[1], {
            apiKey: "img-api-key-2"
        });
    });
});
