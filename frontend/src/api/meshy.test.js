import { describe, it, expect, vi, beforeEach } from 'vitest';
import { meshy } from './meshy';
import { apiFetch } from './client';

// Mock the client
vi.mock('./client', () => ({
    apiFetch: vi.fn(),
}));

describe('meshy API wrapper', () => {
    const mockApiKey = 'test-api-key';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTextTo3D', () => {
        it('calls apiFetch with correct parameters', async () => {
            const payload = { mode: 'preview', prompt: 'a red dragon' };
            await meshy.createTextTo3D(mockApiKey, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
                apiKey: mockApiKey,
                method: 'POST',
                body: payload,
            });
        });
    });

    describe('createTextPreview', () => {
        it('calls apiFetch with correct parameters', async () => {
            const payload = { prompt: 'a red dragon', art_style: 'realistic' };
            await meshy.createTextPreview(mockApiKey, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d/preview', {
                apiKey: mockApiKey,
                method: 'POST',
                body: payload,
            });
        });
    });

    describe('refineText', () => {
        it('calls apiFetch with correct parameters (default payload)', async () => {
            const previewTaskId = 'task-123';
            await meshy.refineText(mockApiKey, previewTaskId);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
                apiKey: mockApiKey,
                method: 'POST',
                body: { mode: 'refine', preview_task_id: previewTaskId },
            });
        });

        it('calls apiFetch with correct parameters (with extra payload)', async () => {
            const previewTaskId = 'task-123';
            const payload = { texture_prompt: 'gold accents' };
            await meshy.refineText(mockApiKey, previewTaskId, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
                apiKey: mockApiKey,
                method: 'POST',
                body: { mode: 'refine', preview_task_id: previewTaskId, ...payload },
            });
        });
    });

    describe('getTextTask', () => {
        it('calls apiFetch with correct parameters', async () => {
            const taskId = 'task-123';
            await meshy.getTextTask(mockApiKey, taskId);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith(`/api/text-to-3d/${taskId}`, {
                apiKey: mockApiKey,
            });
        });
    });

    describe('createImageTo3D', () => {
        it('calls apiFetch with correct parameters', async () => {
            const payload = { image_url: 'https://example.com/image.png' };
            await meshy.createImageTo3D(mockApiKey, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/image-to-3d', {
                apiKey: mockApiKey,
                method: 'POST',
                body: payload,
            });
        });
    });

    describe('getImageTask', () => {
        it('calls apiFetch with correct parameters', async () => {
            const taskId = 'task-456';
            await meshy.getImageTask(mockApiKey, taskId);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith(`/api/image-to-3d/${taskId}`, {
                apiKey: mockApiKey,
            });
        });
    });
});
