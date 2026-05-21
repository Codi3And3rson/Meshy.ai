import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fileToDataUrl } from './fileUtils.js';

describe('fileToDataUrl', () => {
    let originalFileReader;

    beforeEach(() => {
        originalFileReader = globalThis.FileReader;
    });

    afterEach(() => {
        globalThis.FileReader = originalFileReader;
    });

    test('resolves with data URL on successful read', async () => {
        const fakeResult = 'data:image/png;base64,fakebase64data';

        class MockFileReader {
            constructor() {
                this.result = null;
                this.onload = null;
                this.onerror = null;
            }
            readAsDataURL() {
                this.result = fakeResult;
                if (this.onload) {
                    this.onload();
                }
            }
        }

        globalThis.FileReader = MockFileReader;

        const fakeFile = { name: 'test.png', type: 'image/png' };
        const result = await fileToDataUrl(fakeFile);

        assert.equal(result, fakeResult);
    });

    test('rejects with error on failed read', async () => {
        const fakeError = new Error('Failed to read file');

        class MockFileReaderError {
            constructor() {
                this.result = null;
                this.onload = null;
                this.onerror = null;
            }
            readAsDataURL() {
                if (this.onerror) {
                    this.onerror(fakeError);
                }
            }
        }

        globalThis.FileReader = MockFileReaderError;

        const fakeFile = { name: 'test.png', type: 'image/png' };

        await assert.rejects(
            async () => {
                await fileToDataUrl(fakeFile);
            },
            (err) => {
                assert.equal(err, fakeError);
                return true;
            }
        );
    });
});
