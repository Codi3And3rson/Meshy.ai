import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch } from './client';

describe('apiFetch', () => {
    const BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8010";

    beforeEach(() => {
        vi.spyOn(globalThis, 'fetch');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should make a GET request and parse JSON successfully', async () => {
        const mockData = { id: 1, name: 'test' };
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify(mockData)),
        });

        const result = await apiFetch('/test-path');

        expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE}/test-path`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: undefined,
        });
        expect(result).toEqual(mockData);
    });

    it('should include the X-Meshy-Key header when apiKey is provided', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({})),
        });

        await apiFetch('/test-path', { apiKey: 'test-api-key' });

        expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE}/test-path`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Meshy-Key': 'test-api-key',
            },
            body: undefined,
        });
    });

    it('should correctly stringify body for POST requests', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({})),
        });

        const bodyData = { key: 'value' };
        await apiFetch('/post-path', { method: 'POST', body: bodyData });

        expect(globalThis.fetch).toHaveBeenCalledWith(`${BASE}/post-path`, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(bodyData),
        });
    });

    it('should fallback to { raw: text } if JSON parsing fails', async () => {
        const rawText = 'Not a JSON response';
        globalThis.fetch.mockResolvedValueOnce({
            ok: true,
            text: vi.fn().mockResolvedValueOnce(rawText),
        });

        const result = await apiFetch('/text-path');

        expect(result).toEqual({ raw: rawText });
    });

    it('should throw an error with data.detail for FastAPI-style errors', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ detail: 'Invalid input' })),
        });

        await expect(apiFetch('/error-path')).rejects.toThrow('Invalid input');
    });

    it('should throw a fallback HTTP error message if no recognizable error details exist', async () => {
        // We set text to empty string, so data stays null, causing pickErrorMessage to use fallback
        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            text: vi.fn().mockResolvedValueOnce(''),
        });

        await expect(apiFetch('/500-path')).rejects.toThrow('HTTP 500');
    });

    it('should throw common API style errors using data.message', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 403,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ message: 'Forbidden' })),
        });

        await expect(apiFetch('/403-path')).rejects.toThrow('Forbidden');
    });

    it('should throw common API style errors using data.error', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ error: 'Not Found' })),
        });

        await expect(apiFetch('/404-path')).rejects.toThrow('Not Found');
    });

    it('should throw stringified data if no message/error/detail string is available', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 422,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ someKey: 'someError' })),
        });

        await expect(apiFetch('/422-path')).rejects.toThrow('{"someKey":"someError"}');
    });

    it('should handle complex detail arrays (FastAPI-style)', async () => {
        globalThis.fetch.mockResolvedValueOnce({
            ok: false,
            status: 422,
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ detail: [{ msg: 'field required' }] })),
        });

        await expect(apiFetch('/422-detail-path')).rejects.toThrow('[{"msg":"field required"}]');
    });
});
