import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert';
import { apiFetch, apiDownload } from './client.js';

describe('client.js', () => {
    afterEach(() => {
        mock.restoreAll();
    });

    describe('apiFetch', () => {
        test('successful GET request without body/headers', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: true,
                    text: async () => JSON.stringify({ success: true })
                };
            });

            const data = await apiFetch('/test-path');

            assert.strictEqual(mockFetch.mock.calls.length, 1);
            const [url, options] = mockFetch.mock.calls[0].arguments;
            assert.strictEqual(url, 'http://127.0.0.1:8010/test-path');
            assert.strictEqual(options.method, 'GET');
            assert.deepStrictEqual(options.headers, {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            });
            assert.strictEqual(options.body, undefined);
            assert.deepStrictEqual(data, { success: true });
        });

        test('successful POST request with body, headers, and apiKey', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: true,
                    text: async () => JSON.stringify({ success: true })
                };
            });

            const data = await apiFetch('/test-post', {
                method: 'POST',
                apiKey: 'test-key',
                headers: { 'X-Custom': 'custom' },
                body: { data: 'test' }
            });

            assert.strictEqual(mockFetch.mock.calls.length, 1);
            const [url, options] = mockFetch.mock.calls[0].arguments;
            assert.strictEqual(url, 'http://127.0.0.1:8010/test-post');
            assert.strictEqual(options.method, 'POST');
            assert.deepStrictEqual(options.headers, {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Meshy-Key': 'test-key',
                'X-Custom': 'custom'
            });
            assert.strictEqual(options.body, JSON.stringify({ data: 'test' }));
            assert.deepStrictEqual(data, { success: true });
        });

        test('response with non-JSON text', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: true,
                    text: async () => 'raw text response'
                };
            });

            const data = await apiFetch('/test-raw');

            assert.deepStrictEqual(data, { raw: 'raw text response' });
        });

        test('response with no text (empty response)', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: true,
                    text: async () => ''
                };
            });

            const data = await apiFetch('/test-empty');

            assert.deepStrictEqual(data, null);
        });

        test('error with FastAPI-style detail string', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 400,
                    text: async () => JSON.stringify({ detail: 'fastapi detail error' })
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-fastapi-str'); },
                { message: 'fastapi detail error' }
            );
        });

        test('error with FastAPI-style detail object', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 422,
                    text: async () => JSON.stringify({ detail: [{ loc: ['query'], msg: 'field required' }] })
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-fastapi-obj'); },
                { message: JSON.stringify([{ loc: ['query'], msg: 'field required' }]) }
            );
        });

        test('error with message string', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 401,
                    text: async () => JSON.stringify({ message: 'unauthorized' })
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-message'); },
                { message: 'unauthorized' }
            );
        });

        test('error with error string', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 403,
                    text: async () => JSON.stringify({ error: 'forbidden' })
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-error'); },
                { message: 'forbidden' }
            );
        });

        test('error with unknown structure', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 500,
                    text: async () => JSON.stringify({ unknown: 'format' })
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-unknown'); },
                { message: JSON.stringify({ unknown: 'format' }) }
            );
        });

        test('error with non-JSON response body', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 502,
                    text: async () => 'Bad Gateway'
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-bad-gateway'); },
                { message: JSON.stringify({ raw: 'Bad Gateway' }) }
            );
        });

        test('error with empty response body', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 404,
                    text: async () => ''
                };
            });

            await assert.rejects(
                async () => { await apiFetch('/error-empty'); },
                { message: 'HTTP 404' }
            );
        });
    });

    describe('apiDownload', () => {
        test('successful download', async () => {
            const mockBlob = new Blob(['test-blob']);
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: true,
                    blob: async () => mockBlob
                };
            });

            const blob = await apiDownload('http://test.com/file.png');

            assert.strictEqual(mockFetch.mock.calls.length, 1);
            const [url] = mockFetch.mock.calls[0].arguments;
            assert.strictEqual(url, 'http://test.com/file.png');
            assert.strictEqual(blob, mockBlob);
        });

        test('failed download', async () => {
            const mockFetch = mock.method(globalThis, 'fetch', async () => {
                return {
                    ok: false,
                    status: 500
                };
            });

            await assert.rejects(
                async () => { await apiDownload('http://test.com/file.png'); },
                { message: 'Download failed (500)' }
            );
        });
    });
});
