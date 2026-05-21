import { describe, it, expect, vi } from 'vitest';
import { meshy } from './meshy';
import * as client from './client';

vi.mock('./client', () => ({
    apiFetch: vi.fn()
}));

describe('meshy API', () => {
    it('createTextPreview calls apiFetch with correct parameters', async () => {
        const apiKey = 'test-key';
        const payload = { prompt: 'a red dragon' };

        // Arrange: set up mock return value just in case
        vi.mocked(client.apiFetch).mockResolvedValueOnce({ id: 'task-id' });

        // Act
        await meshy.createTextPreview(apiKey, payload);

        // Assert
        expect(client.apiFetch).toHaveBeenCalledWith('/api/text-to-3d/preview', {
            apiKey: 'test-key',
            method: 'POST',
            body: { prompt: 'a red dragon' }
        });
    });
});
