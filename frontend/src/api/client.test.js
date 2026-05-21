import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiDownload } from './client.js';

describe('apiDownload', () => {
    beforeEach(() => {
        // Clear any previous mocks
        if (globalThis.fetch) {
            vi.restoreAllMocks();
        }
    });

    it('downloads successfully and returns a blob', async () => {
        const dummyBlob = new Blob(['dummy content'], { type: 'text/plain' });
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            blob: async () => dummyBlob,
        });

        const url = 'http://example.com/file.txt';
        const result = await apiDownload(url);

        expect(globalThis.fetch).toHaveBeenCalledWith(url);
        expect(result).toBe(dummyBlob);
    });

    it('throws an error if response is not ok', async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
        });

        const url = 'http://example.com/missing.txt';

        await expect(apiDownload(url)).rejects.toThrow('Download failed (404)');
        expect(globalThis.fetch).toHaveBeenCalledWith(url);
    });
});
