import { describe, it } from 'node:test';
import assert from 'node:assert';
import esmock from 'esmock';

describe('meshy api tests', () => {
    it('createTextTo3D spies on apiFetch', async () => {
        let calledPath, calledOptions;

        const { meshy } = await esmock('./meshy.js', {
            './client.js': {
                apiFetch: async (path, options) => {
                    calledPath = path;
                    calledOptions = options;
                    return { result: 'ok' };
                }
            }
        });

        const result = await meshy.createTextTo3D('test-key', { mode: 'preview', prompt: 'dragon' });

        assert.strictEqual(result.result, 'ok');
        assert.strictEqual(calledPath, '/api/text-to-3d');
        assert.strictEqual(calledOptions.apiKey, 'test-key');
        assert.strictEqual(calledOptions.method, 'POST');
        assert.strictEqual(calledOptions.body.mode, 'preview');
        assert.strictEqual(calledOptions.body.prompt, 'dragon');
    });
});

describe('meshy error handling', () => {
    it('createTextTo3D throws on fetch error', async () => {
        const { meshy } = await esmock('./meshy.js', {
            './client.js': {
                apiFetch: async () => {
                    throw new Error('mock error');
                }
            }
        });

        await assert.rejects(
            meshy.createTextTo3D('test-key', { mode: 'preview' }),
            /mock error/
        );
    });
});
