import { describe, it, expect } from 'vitest';
import { filenameFromUrl } from './Dashboard';

describe('filenameFromUrl', () => {
    it('extracts the filename from a standard URL', () => {
        expect(filenameFromUrl('https://example.com/models/car.glb')).toBe('car.glb');
    });

    it('extracts the filename from a URL with query parameters', () => {
        expect(filenameFromUrl('https://example.com/path/to/model.fbx?version=1&download=true')).toBe('model.fbx');
    });

    it('extracts the filename from a URL with a hash fragment', () => {
        expect(filenameFromUrl('https://example.com/asset.obj#texture')).toBe('asset.obj');
    });

    it('returns the fallback name if the URL has no path components', () => {
        expect(filenameFromUrl('https://example.com')).toBe('model.bin');
        expect(filenameFromUrl('https://example.com/')).toBe('model.bin');
    });

    it('returns the custom fallback name if the URL has no path components and a custom fallback is provided', () => {
        expect(filenameFromUrl('https://example.com/', 'custom.bin')).toBe('custom.bin');
    });

    it('returns the fallback name for an invalid URL', () => {
        expect(filenameFromUrl('not-a-url')).toBe('model.bin');
    });

    it('returns the custom fallback name for an invalid URL if a custom fallback is provided', () => {
        expect(filenameFromUrl('not-a-url', 'invalid.bin')).toBe('invalid.bin');
    });

    it('handles URLs with multiple consecutive slashes in the path', () => {
        expect(filenameFromUrl('https://example.com/some//weird///path/model.usdz')).toBe('model.usdz');
    });

    it('handles an empty string as a URL', () => {
        expect(filenameFromUrl('')).toBe('model.bin');
    });

    it('handles undefined or null gracefully by using the fallback name', () => {
        expect(filenameFromUrl(undefined)).toBe('model.bin');
        expect(filenameFromUrl(null)).toBe('model.bin');
    });
});
