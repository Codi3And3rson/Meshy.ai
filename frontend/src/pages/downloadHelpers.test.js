import { test, mock } from 'node:test';
import assert from 'node:assert';
import { handleFileDownload } from './downloadHelpers.js';

test('handleFileDownload sets error and triggers direct download on API failure', async () => {
    let busySet = false;
    let errorSet = '';

    const setBusy = (val) => { busySet = val; };
    const setError = (val) => { errorSet = val; };

    const apiDownloadFn = async () => {
        throw new Error('Network timeout');
    };

    let directDownloadTriggered = false;
    let anchorAppended = false;
    let clickCalled = false;
    let anchorRemoved = false;

    // Mock DOM
    globalThis.document = {
        createElement: (tag) => {
            if (tag === 'a') {
                return {
                    click: () => { clickCalled = true; },
                    remove: () => { anchorRemoved = true; },
                    href: '',
                    target: '',
                    rel: '',
                };
            }
            return {};
        },
        body: {
            appendChild: (el) => { anchorAppended = true; directDownloadTriggered = el.target === '_blank'; }
        }
    };

    await handleFileDownload('http://example.com/model.glb', 'glb', apiDownloadFn, setBusy, setError);

    assert.ok(errorSet.includes('Network timeout'));
    assert.ok(errorSet.includes('Falling back to direct download.'));
    assert.ok(directDownloadTriggered);
    assert.ok(anchorAppended);
    assert.ok(clickCalled);
    assert.ok(anchorRemoved);
    assert.strictEqual(busySet, false); // finally block

    // Cleanup
    delete globalThis.document;
});

test('handleFileDownload triggers browser download on API success', async () => {
    mock.timers.enable({ apis: ['setTimeout'] });

    let busySet = false;
    let errorSet = '';

    const setBusy = (val) => { busySet = val; };
    const setError = (val) => { errorSet = val; };

    globalThis.Blob = class { constructor(data, opts) { this.data = data; this.opts = opts; } };
    const mockBlob = new Blob(['dummy content'], { type: 'text/plain' });
    const apiDownloadFn = async () => {
        return mockBlob;
    };

    let browserDownloadTriggered = false;
    let anchorAppended = false;
    let clickCalled = false;
    let anchorRemoved = false;

    // Mock DOM and URL
    globalThis.document = {
        createElement: (tag) => {
            if (tag === 'a') {
                return {
                    click: () => { clickCalled = true; },
                    remove: () => { anchorRemoved = true; },
                    href: '',
                    download: '',
                };
            }
            return {};
        },
        body: {
            appendChild: (el) => {
                anchorAppended = true;
                if (el.download) browserDownloadTriggered = true;
            }
        }
    };

    globalThis.URL = {
        createObjectURL: () => 'blob:dummy-url',
        revokeObjectURL: () => {}
    };

    await handleFileDownload('http://example.com/model.glb', 'glb', apiDownloadFn, setBusy, setError);

    assert.strictEqual(errorSet, '');
    assert.ok(browserDownloadTriggered);
    assert.ok(anchorAppended);
    assert.ok(clickCalled);
    assert.ok(anchorRemoved);
    assert.strictEqual(busySet, false); // finally block

    // Fast-forward timers to run the setTimeout in triggerBrowserDownload
    mock.timers.tick(1500);

    // Cleanup
    delete globalThis.document;
    delete globalThis.URL;
    delete globalThis.Blob;
    mock.timers.reset();
});
