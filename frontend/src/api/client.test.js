import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, apiDownload } from './client.js';

describe('apiFetch', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    it('makes a GET request with default headers and correct URL from env', async () => {
        const mockResponse = { ok: true, text: vi.fn().mockResolvedValue('{"success": true}') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        const result = await apiFetch('/test-path');

        // VITE_API_BASE_URL is set in vite.config.js test env
        expect(globalThis.fetch).toHaveBeenCalledWith(
            'http://test-api.example.com/test-path',
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: undefined,
            }
        );
        expect(result).toEqual({ success: true });
    });

    it('adds X-Meshy-Key header if apiKey is provided', async () => {
        const mockResponse = { ok: true, text: vi.fn().mockResolvedValue('{}') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await apiFetch('/test-path', { apiKey: 'test-api-key' });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Meshy-Key': 'test-api-key',
                }),
            })
        );
    });

    it('merges custom headers', async () => {
        const mockResponse = { ok: true, text: vi.fn().mockResolvedValue('{}') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await apiFetch('/test-path', { headers: { 'X-Custom': 'custom-value' } });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Custom': 'custom-value',
                    'Content-Type': 'application/json',
                }),
            })
        );
    });

    it('stringifies body and uses specified method', async () => {
        const mockResponse = { ok: true, text: vi.fn().mockResolvedValue('{}') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await apiFetch('/test-path', { method: 'POST', body: { key: 'value' } });

        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                method: 'POST',
                body: '{"key":"value"}',
            })
        );
    });

    it('falls back to raw text if JSON parsing fails', async () => {
        const mockResponse = { ok: true, text: vi.fn().mockResolvedValue('raw text response') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        const result = await apiFetch('/test-path');

        expect(result).toEqual({ raw: 'raw text response' });
    });

    it('handles successful response with no text body gracefully', async () => {
        const mockResponse = { ok: true, text: vi.fn().mockResolvedValue('') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        const result = await apiFetch('/test-path');

        expect(result).toBeNull();
    });

    it('throws error with status fallback if no text response on non-ok status', async () => {
        const mockResponse = { ok: false, status: 404, text: vi.fn().mockResolvedValue('') };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiFetch('/test-path')).rejects.toThrow('HTTP 404');
    });

    it('throws error with FastAPI detail string', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            text: vi.fn().mockResolvedValue('{"detail": "FastAPI error"}')
        };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiFetch('/test-path')).rejects.toThrow('FastAPI error');
    });

    it('throws error with FastAPI detail object', async () => {
        const mockResponse = {
            ok: false,
            status: 422,
            text: vi.fn().mockResolvedValue('{"detail": [{"loc": ["body"], "msg": "Field required"}]}')
        };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiFetch('/test-path')).rejects.toThrow('[{"loc":["body"],"msg":"Field required"}]');
    });

    it('throws error with common message string', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            text: vi.fn().mockResolvedValue('{"message": "Common error message"}')
        };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiFetch('/test-path')).rejects.toThrow('Common error message');
    });

    it('throws error with common error string', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            text: vi.fn().mockResolvedValue('{"error": "Common error string"}')
        };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiFetch('/test-path')).rejects.toThrow('Common error string');
    });

    it('throws error falling back to stringified data if unknown shape', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            text: vi.fn().mockResolvedValue('{"unknown": "shape"}')
        };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiFetch('/test-path')).rejects.toThrow('{"unknown":"shape"}');
    });

    it('throws error with raw fallback if JSON parsing fails on non-ok status', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            text: vi.fn().mockResolvedValue('Internal Server Error')
        };
        globalThis.fetch.mockResolvedValue(mockResponse);

        // data will be { raw: 'Internal Server Error' }
        await expect(apiFetch('/test-path')).rejects.toThrow('{"raw":"Internal Server Error"}');
    });
});

describe('apiDownload', () => {
    beforeEach(() => {
        globalThis.fetch = vi.fn();
    });

    it('downloads blob successfully', async () => {
        const mockBlob = new Blob(['test content']);
        const mockResponse = { ok: true, blob: vi.fn().mockResolvedValue(mockBlob) };
        globalThis.fetch.mockResolvedValue(mockResponse);

        const result = await apiDownload('http://example.com/file');

        expect(globalThis.fetch).toHaveBeenCalledWith('http://example.com/file');
        expect(result).toBe(mockBlob);
    });

    it('throws error if download fails', async () => {
        const mockResponse = { ok: false, status: 404 };
        globalThis.fetch.mockResolvedValue(mockResponse);

        await expect(apiDownload('http://example.com/file')).rejects.toThrow('Download failed (404)');
    });
});
