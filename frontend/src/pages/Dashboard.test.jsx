import { describe, it, expect } from 'vitest';
import { extractModelUrls } from './Dashboard';

describe('extractModelUrls', () => {
    it('returns an empty object if taskRaw is falsy', () => {
        expect(extractModelUrls(null)).toEqual({});
        expect(extractModelUrls(undefined)).toEqual({});
        expect(extractModelUrls('')).toEqual({});
        expect(extractModelUrls(0)).toEqual({});
    });

    it('returns an empty object if no model_urls are present', () => {
        expect(extractModelUrls({})).toEqual({});
        expect(extractModelUrls({ id: '123' })).toEqual({});
        expect(extractModelUrls({ result: {} })).toEqual({});
        expect(extractModelUrls({ output: {} })).toEqual({});
    });

    it('extracts URLs from top-level model_urls', () => {
        const taskRaw = {
            model_urls: {
                glb: 'https://example.com/model.glb',
                fbx: 'https://example.com/model.fbx',
                obj: 'https://example.com/model.obj',
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({
            glb: 'https://example.com/model.glb',
            fbx: 'https://example.com/model.fbx',
            obj: 'https://example.com/model.obj',
        });
    });

    it('extracts URLs from top-level modelUrls', () => {
        const taskRaw = {
            modelUrls: {
                usdz: 'https://example.com/model.usdz',
                mtl: 'https://example.com/model.mtl',
                pre_remeshed_glb: 'https://example.com/pre.glb'
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({
            usdz: 'https://example.com/model.usdz',
            mtl: 'https://example.com/model.mtl',
            pre_remeshed_glb: 'https://example.com/pre.glb',
        });
    });

    it('extracts URLs from nested result.model_urls', () => {
        const taskRaw = {
            result: {
                model_urls: {
                    glb: 'https://example.com/result.glb'
                }
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({
            glb: 'https://example.com/result.glb'
        });
    });

    it('extracts URLs from nested output.model_urls', () => {
        const taskRaw = {
            output: {
                model_urls: {
                    fbx: 'https://example.com/output.fbx'
                }
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({
            fbx: 'https://example.com/output.fbx'
        });
    });

    it('trims string values', () => {
        const taskRaw = {
            model_urls: {
                glb: '  https://example.com/model.glb  ',
                obj: '\nhttps://example.com/model.obj\t'
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({
            glb: 'https://example.com/model.glb',
            obj: 'https://example.com/model.obj'
        });
    });

    it('ignores empty strings and non-string values', () => {
        const taskRaw = {
            model_urls: {
                glb: '',
                fbx: '   ',
                obj: null,
                usdz: undefined,
                mtl: 123,
                pre_remeshed_glb: {}
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({});
    });

    it('only extracts allowed keys', () => {
        const taskRaw = {
            model_urls: {
                glb: 'https://example.com/model.glb',
                png: 'https://example.com/image.png', // not an allowed key
                thumbnail: 'https://example.com/thumb.jpg' // not an allowed key
            }
        };
        expect(extractModelUrls(taskRaw)).toEqual({
            glb: 'https://example.com/model.glb'
        });
    });
});
