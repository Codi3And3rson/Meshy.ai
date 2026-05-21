import { describe, it, expect } from 'vitest';
import { detectModelUrl } from './Dashboard';

describe('detectModelUrl', () => {
    it('returns empty string for null, undefined, or empty object', () => {
        expect(detectModelUrl(null)).toBe("");
        expect(detectModelUrl(undefined)).toBe("");
        expect(detectModelUrl({})).toBe("");
    });

    it('extracts glb correctly from root model_urls', () => {
        const payload = {
            model_urls: {
                glb: "https://example.com/model.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/model.glb");
    });

    it('extracts glb correctly from result.model_urls', () => {
        const payload = {
            result: {
                model_urls: {
                    glb: "https://example.com/result-model.glb"
                }
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/result-model.glb");
    });

    it('extracts glb correctly from output.model_urls', () => {
        const payload = {
            output: {
                model_urls: {
                    glb: "https://example.com/output-model.glb"
                }
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/output-model.glb");
    });

    it('extracts glb correctly from camelCase modelUrls', () => {
        const payload = {
            modelUrls: {
                glb: "https://example.com/camel-model.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/camel-model.glb");
    });

    it('prioritizes formats correctly: glb > pre_remeshed_glb > fbx > obj > usdz', () => {
        const payload = {
            model_urls: {
                obj: "https://example.com/model.obj",
                fbx: "https://example.com/model.fbx",
                pre_remeshed_glb: "https://example.com/pre.glb",
                usdz: "https://example.com/model.usdz",
            }
        };
        // Should pick pre_remeshed_glb as it's highest priority present
        expect(detectModelUrl(payload)).toBe("https://example.com/pre.glb");

        const payload2 = {
            model_urls: {
                usdz: "https://example.com/model.usdz",
                obj: "https://example.com/model.obj",
            }
        };
        expect(detectModelUrl(payload2)).toBe("https://example.com/model.obj");
    });

    it('falls back to model.download_url', () => {
        const payload = {
            model: {
                download_url: "https://example.com/download.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/download.glb");
    });

    it('falls back to model_url', () => {
        const payload = {
            model_url: "https://example.com/root-model.glb"
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/root-model.glb");
    });

    it('falls back to result.model_url', () => {
        const payload = {
            result: {
                model_url: "https://example.com/result.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/result.glb");
    });

    it('falls back to result.glb', () => {
        const payload = {
            result: {
                glb: "https://example.com/res.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/res.glb");
    });

    it('falls back to output.glb', () => {
        const payload = {
            output: {
                glb: "https://example.com/out.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/out.glb");
    });

    it('falls back to output.model_url', () => {
        const payload = {
            output: {
                model_url: "https://example.com/out-model.glb"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/out-model.glb");
    });

    it('prioritizes model_urls over fallback fields', () => {
        const payload = {
            model_urls: {
                fbx: "https://example.com/model.fbx"
            },
            model_url: "https://example.com/fallback.glb"
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/model.fbx");
    });

    it('trims whitespace from URLs and ignores empty strings if no valid candidates', () => {
        expect(detectModelUrl({ model_urls: { glb: " https://example.com/model.glb  " } })).toBe("https://example.com/model.glb");
    });

    it('skips empty or whitespace-only strings properly when other properties are available', () => {
        const payload = {
            model_urls: {
                glb: " ",
                fbx: "https://example.com/model.fbx"
            }
        };
        expect(detectModelUrl(payload)).toBe("https://example.com/model.fbx");
    });
});
