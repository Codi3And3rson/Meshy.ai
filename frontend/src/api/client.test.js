import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, apiDownload, pickErrorMessage } from './client.js';

describe('client.js', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        global.fetch = vi.fn();
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    describe('pickErrorMessage', () => {
        const fallbackMsg = 'Default fallback';

        it('returns fallback if data is falsy', () => {
            expect(pickErrorMessage(null, fallbackMsg)).toBe(fallbackMsg);
            expect(pickErrorMessage(undefined, fallbackMsg)).toBe(fallbackMsg);
        });

        it('handles FastAPI-style detail (string)', () => {
            const data = { detail: 'Not Found' };
            expect(pickErrorMessage(data, fallbackMsg)).toBe('Not Found');
        });

        it('handles FastAPI-style detail (array/object)', () => {
            const data = { detail: [{ msg: 'Field required' }] };
            expect(pickErrorMessage(data, fallbackMsg)).toBe(JSON.stringify([{ msg: 'Field required' }]));
        });

        it('handles Common API styles (message string)', () => {
            const data = { message: 'An error occurred' };
            expect(pickErrorMessage(data, fallbackMsg)).toBe('An error occurred');
        });

        it('handles Common API styles (error string)', () => {
            const data = { error: 'Unauthorized' };
            expect(pickErrorMessage(data, fallbackMsg)).toBe('Unauthorized');
        });

        it('fallbacks to JSON stringify for other objects', () => {
            const data = { unknownField: 'some error' };
            expect(pickErrorMessage(data, fallbackMsg)).toBe(JSON.stringify(data));
        });

        it('returns fallback if JSON stringify fails (e.g. circular ref)', () => {
            const obj = {};
            obj.circular = obj;
            expect(pickErrorMessage(obj, fallbackMsg)).toBe(fallbackMsg);
        });
    });

    describe('apiFetch', () => {
        it('performs a GET request by default and parses JSON', async () => {
            const mockData = { success: true };
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify(mockData)
            });

            const data = await apiFetch('/test-path');
            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/test-path'), {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: undefined
            });
            expect(data).toEqual(mockData);
        });

        it('supports custom methods, body, headers, and apiKey', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => JSON.stringify({ id: 1 })
            });

            await apiFetch('/custom', {
                method: 'POST',
                apiKey: 'test-key',
                headers: { 'X-Custom': '123' },
                body: { data: 'foo' }
            });

            expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/custom'), {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Meshy-Key': 'test-key',
                    'X-Custom': '123'
                },
                body: JSON.stringify({ data: 'foo' })
            });
        });

        it('throws an Error when response is not ok', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                text: async () => JSON.stringify({ error: 'Bad Request' })
            });

            await expect(apiFetch('/error')).rejects.toThrow('Bad Request');
        });

        it('returns an object with raw data if JSON parsing fails on a successful request', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: true,
                text: async () => 'Not JSON format'
            });

            const data = await apiFetch('/bad-json');
            expect(data).toEqual({ raw: 'Not JSON format' });
        });

        it('throws an Error with fallback if response is not ok and JSON parsing fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error (not json)'
            });

            await expect(apiFetch('/fail')).rejects.toThrow('{"raw":"Internal Server Error (not json)"}');
        });
    });

    describe('apiDownload', () => {
        it('returns a Blob when response is ok', async () => {
            const mockBlob = new Blob(['test content']);
            global.fetch.mockResolvedValueOnce({
                ok: true,
                blob: async () => mockBlob
            });

            const blob = await apiDownload('http://example.com/file');
            expect(global.fetch).toHaveBeenCalledWith('http://example.com/file');
            expect(blob).toEqual(mockBlob);
        });

        it('throws an Error when download fails', async () => {
            global.fetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(apiDownload('http://example.com/notfound')).rejects.toThrow('Download failed (404)');
        });
    });
});
