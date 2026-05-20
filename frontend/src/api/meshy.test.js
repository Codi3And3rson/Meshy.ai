import { describe, it, expect, vi, beforeEach } from 'vitest';
import { meshy } from './meshy';
import { apiFetch } from './client';

// Mock the client module
vi.mock('./client', () => ({
    apiFetch: vi.fn(),
}));

describe('meshy API object', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const apiKey = 'test-api-key';

    describe('createTextTo3D', () => {
        it('should call apiFetch with correct arguments', () => {
            const payload = { mode: 'preview', prompt: 'a red dragon' };
            meshy.createTextTo3D(apiKey, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
                apiKey,
                method: 'POST',
                body: payload,
            });
        });
    });

    describe('createTextPreview', () => {
        it('should call apiFetch with correct arguments', () => {
            const payload = { prompt: 'a red dragon' };
            meshy.createTextPreview(apiKey, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d/preview', {
                apiKey,
                method: 'POST',
                body: payload,
            });
        });
    });

    describe('refineText', () => {
        it('should call apiFetch with correct arguments using default payload', () => {
            const previewTaskId = 'task-123';
            meshy.refineText(apiKey, previewTaskId);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
                apiKey,
                method: 'POST',
                body: { mode: 'refine', preview_task_id: previewTaskId },
            });
        });

        it('should call apiFetch with correct arguments including additional payload', () => {
            const previewTaskId = 'task-123';
            const payload = { texture_prompt: 'gold accents' };
            meshy.refineText(apiKey, previewTaskId, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/text-to-3d', {
                apiKey,
                method: 'POST',
                body: { mode: 'refine', preview_task_id: previewTaskId, texture_prompt: 'gold accents' },
            });
        });
    });

    describe('getTextTask', () => {
        it('should call apiFetch with correct arguments', () => {
            const taskId = 'task-123';
            meshy.getTextTask(apiKey, taskId);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith(`/api/text-to-3d/${taskId}`, {
                apiKey,
            });
        });
    });

    describe('createImageTo3D', () => {
        it('should call apiFetch with correct arguments', () => {
            const payload = { image_url: 'http://example.com/image.png' };
            meshy.createImageTo3D(apiKey, payload);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith('/api/image-to-3d', {
                apiKey,
                method: 'POST',
                body: payload,
            });
        });
    });

    describe('getImageTask', () => {
        it('should call apiFetch with correct arguments', () => {
            const taskId = 'task-456';
            meshy.getImageTask(apiKey, taskId);

            expect(apiFetch).toHaveBeenCalledTimes(1);
            expect(apiFetch).toHaveBeenCalledWith(`/api/image-to-3d/${taskId}`, {
                apiKey,
            });
        });
    });
});