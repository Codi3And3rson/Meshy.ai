import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as client from './client.js';
import { meshy } from './meshy.js';

// Fully mock the client module
vi.mock('./client.js', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        apiFetch: vi.fn(async () => ({ ok: true })),
    };
});

describe('meshy API refineText', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('refineText calls apiFetch with correct arguments', async () => {
        const apiKey = 'test-api-key';
        const previewTaskId = 'test-preview-task-id';
        const payload = { texture_prompt: 'test texture' };

        await meshy.refineText(apiKey, previewTaskId, payload);

        expect(client.apiFetch).toHaveBeenCalledTimes(1);
        expect(client.apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
            apiKey,
            method: 'POST',
            body: {
                mode: 'refine',
                preview_task_id: previewTaskId,
                texture_prompt: 'test texture',
            },
        });
    });

    it('refineText handles missing payload gracefully', async () => {
        const apiKey = 'test-api-key';
        const previewTaskId = 'test-preview-task-id';

        await meshy.refineText(apiKey, previewTaskId);

        expect(client.apiFetch).toHaveBeenCalledTimes(1);
        expect(client.apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
            apiKey,
            method: 'POST',
            body: {
                mode: 'refine',
                preview_task_id: previewTaskId,
            },
        });
    });
});
