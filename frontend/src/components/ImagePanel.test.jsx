import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fileToDataUrl } from './ImagePanel';

describe('fileToDataUrl', () => {
  let originalFileReader;

  beforeEach(() => {
    originalFileReader = globalThis.FileReader;
  });

  afterEach(() => {
    globalThis.FileReader = originalFileReader;
  });

  it('should resolve with the data URL when read is successful', async () => {
    const mockDataUrl = 'data:image/png;base64,mockbase64data';
    const mockFile = new File([''], 'test.png', { type: 'image/png' });

    // Mock FileReader implementation
    class MockFileReader {
      constructor() {
        this.result = null;
        this.onerror = null;
        this.onload = null;
      }

      readAsDataURL() {
        this.result = mockDataUrl;
        // Simulate successful read asynchronously to avoid resolving before setting onload
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    }

    globalThis.FileReader = MockFileReader;

    const dataUrl = await fileToDataUrl(mockFile);
    expect(dataUrl).toBe(mockDataUrl);
  });

  it('should reject with an error when read fails', async () => {
    const mockFile = new File([''], 'test.png', { type: 'image/png' });
    const mockError = new Error('Failed to read file');

    // Mock FileReader implementation for error case
    class MockFileReader {
      constructor() {
        this.result = null;
        this.onerror = null;
        this.onload = null;
      }

      readAsDataURL() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(mockError);
          }
        }, 0);
      }
    }

    globalThis.FileReader = MockFileReader;

    await expect(fileToDataUrl(mockFile)).rejects.toThrow('Failed to read file');
  });
});
