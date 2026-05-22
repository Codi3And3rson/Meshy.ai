import test from "node:test";
import assert from "node:assert";
import { detectModelUrl, extractModelUrls, filenameFromUrl } from "./modelHelpers.js";

test("detectModelUrl should handle empty or null input", () => {
    assert.strictEqual(detectModelUrl(null), "");
    assert.strictEqual(detectModelUrl(undefined), "");
    assert.strictEqual(detectModelUrl({}), "");
});

test("detectModelUrl should find glb url inside model_urls", () => {
    const task = {
        model_urls: {
            glb: "http://example.com/model.glb"
        }
    };
    assert.strictEqual(detectModelUrl(task), "http://example.com/model.glb");
});

test("detectModelUrl should prioritize glb over fbx", () => {
    const task = {
        model_urls: {
            fbx: "http://example.com/model.fbx",
            glb: "http://example.com/model.glb"
        }
    };
    assert.strictEqual(detectModelUrl(task), "http://example.com/model.glb");
});

test("detectModelUrl should find output.model_urls", () => {
    const task = {
        output: {
            model_urls: {
                obj: "http://example.com/model.obj"
            }
        }
    };
    assert.strictEqual(detectModelUrl(task), "http://example.com/model.obj");
});

test("detectModelUrl should find model_url directly on task", () => {
    const task = {
        model_url: "http://example.com/model2.glb"
    };
    assert.strictEqual(detectModelUrl(task), "http://example.com/model2.glb");
});

test("extractModelUrls should extract valid string urls", () => {
    const task = {
        model_urls: {
            glb: "http://example.com/model.glb",
            usdz: "http://example.com/model.usdz",
            invalid: 123
        }
    };
    const extracted = extractModelUrls(task);
    assert.deepStrictEqual(extracted, {
        glb: "http://example.com/model.glb",
        usdz: "http://example.com/model.usdz"
    });
});

test("filenameFromUrl should return last part of url path", () => {
    assert.strictEqual(filenameFromUrl("http://example.com/path/to/my_model.glb"), "my_model.glb");
    assert.strictEqual(filenameFromUrl("http://example.com/", "fallback.bin"), "fallback.bin");
    assert.strictEqual(filenameFromUrl("invalid-url", "fallback.bin"), "fallback.bin");
});
