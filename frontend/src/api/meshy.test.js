import { describe, it, expect, vi, beforeEach } from 'vitest';
import { meshy } from './meshy';
import * as client from './client';

describe('meshy API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createTextTo3D', () => {
        it('should call apiFetch with correct arguments and return data', async () => {
            const mockResponse = { result: 'task-123', status: 'pending' };
            const apiFetchSpy = vi.spyOn(client, 'apiFetch').mockResolvedValue(mockResponse);

            const apiKey = 'test-api-key';
            const payload = { mode: "preview", prompt: "a red dragon" };

            const result = await meshy.createTextTo3D(apiKey, payload);

            expect(apiFetchSpy).toHaveBeenCalledTimes(1);
            expect(apiFetchSpy).toHaveBeenCalledWith("/api/text-to-3d", {
                apiKey,
                method: "POST",
                body: payload
            });
            expect(result).toEqual(mockResponse);
        });

        it('should propagate errors from apiFetch', async () => {
            const apiFetchSpy = vi.spyOn(client, 'apiFetch').mockRejectedValue(new Error('Network error'));

            const apiKey = 'test-api-key';
            const payload = { mode: "preview", prompt: "a red dragon" };

            await expect(meshy.createTextTo3D(apiKey, payload)).rejects.toThrow('Network error');

            expect(apiFetchSpy).toHaveBeenCalledTimes(1);
        });
    });
});
