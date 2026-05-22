import test from 'node:test';
import assert from 'node:assert/strict';
import { extractModelUrls } from './modelUtils.js';

test('extractModelUrls', async (t) => {
    await t.test('handles null/undefined input', () => {
        assert.deepEqual(extractModelUrls(null), {});
        assert.deepEqual(extractModelUrls(undefined), {});
    });

    await t.test('handles missing model_urls gracefully', () => {
        assert.deepEqual(extractModelUrls({}), {});
        assert.deepEqual(extractModelUrls({ id: "123" }), {});
    });

    await t.test('extracts from t.model_urls', () => {
        const input = {
            model_urls: {
                glb: " https://example.com/model.glb ",
                fbx: "https://example.com/model.fbx",
                unknown: "https://example.com/model.unknown"
            }
        };
        const expected = {
            glb: "https://example.com/model.glb",
            fbx: "https://example.com/model.fbx"
        };
        assert.deepEqual(extractModelUrls(input), expected);
    });

    await t.test('extracts from t.result.model_urls', () => {
        const input = {
            result: {
                model_urls: {
                    obj: "https://example.com/model.obj",
                    usdz: "https://example.com/model.usdz",
                    mtl: "  " // should be ignored
                }
            }
        };
        const expected = {
            obj: "https://example.com/model.obj",
            usdz: "https://example.com/model.usdz"
        };
        assert.deepEqual(extractModelUrls(input), expected);
    });

    await t.test('extracts from t.output.model_urls', () => {
        const input = {
            output: {
                model_urls: {
                    pre_remeshed_glb: "https://example.com/pre.glb"
                }
            }
        };
        const expected = {
            pre_remeshed_glb: "https://example.com/pre.glb"
        };
        assert.deepEqual(extractModelUrls(input), expected);
    });

    await t.test('extracts from t.modelUrls', () => {
        const input = {
            modelUrls: {
                mtl: "https://example.com/model.mtl"
            }
        };
        const expected = {
            mtl: "https://example.com/model.mtl"
        };
        assert.deepEqual(extractModelUrls(input), expected);
    });

    await t.test('ignores invalid or empty values', () => {
        const input = {
            model_urls: {
                glb: "", // empty string
                fbx: "   ", // spaces
                obj: null, // null
                usdz: undefined, // undefined
                mtl: 123, // number
                pre_remeshed_glb: "valid.glb" // valid
            }
        };
        const expected = {
            pre_remeshed_glb: "valid.glb"
        };
        assert.deepEqual(extractModelUrls(input), expected);
    });
});
