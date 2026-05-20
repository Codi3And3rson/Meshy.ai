import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiDownload } from './client';

describe('apiDownload', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('should successfully download and return a blob', async () => {
        // Mock a successful fetch response
        const mockBlob = new Blob(['test content'], { type: 'text/plain' });
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            blob: async () => mockBlob,
        });

        const url = 'https://example.com/test.txt';
        const result = await apiDownload(url);

        expect(fetchMock).toHaveBeenCalledWith(url);
        expect(result).toBeInstanceOf(Blob);
        const text = await result.text();
        expect(text).toBe('test content');
    });

    it('should throw an error if the response is not ok', async () => {
        // Mock a failed fetch response
        const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 404,
        });

        const url = 'https://example.com/not-found.txt';

        await expect(apiDownload(url)).rejects.toThrow('Download failed (404)');
        expect(fetchMock).toHaveBeenCalledWith(url);
    });
});
