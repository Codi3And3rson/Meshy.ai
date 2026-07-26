import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert';

describe('meshy.createTextTo3D', () => {
    afterEach(() => {
        mock.restoreAll();
    });

    it('calls apiFetch with correct URL, method, API key, and payload', async () => {
        // Mock the client module with a configurable mock
        let throwError = false;

        const apiFetchMock = mock.fn(async () => {
            if (throwError) throw new Error('API Error');
            return { result: 'success' };
        });

        mock.module('./client.js', {
            namedExports: {
                apiFetch: apiFetchMock
            }
        });

        const meshyModule = await import(`./meshy.js`);
        const { meshy } = meshyModule;

        const apiKey = 'test-api-key';
        const payload = { mode: "preview", prompt: "a red dragon", art_style: "realistic", should_texture: true };

        const result = await meshy.createTextTo3D(apiKey, payload);

        assert.deepStrictEqual(result, { result: 'success' });

        // Assert apiFetch was called exactly once
        assert.strictEqual(apiFetchMock.mock.callCount(), 1);

        const call = apiFetchMock.mock.calls[0];
        const [url, options] = call.arguments;

        assert.strictEqual(url, '/api/text-to-3d');
        assert.strictEqual(options.method, 'POST');
        assert.strictEqual(options.apiKey, apiKey);
        assert.deepStrictEqual(options.body, payload);

        // Test error case in the same run to avoid module cache issues without ?bust=
        throwError = true;

        await assert.rejects(
            async () => await meshy.createTextTo3D('invalid-key', { prompt: "test" }),
            (err) => {
                assert.strictEqual(err.message, 'API Error');
                return true;
            }
        );

        // Check call count is now 2
        assert.strictEqual(apiFetchMock.mock.callCount(), 2);
    });
});
