import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { pickErrorMessage } from './client.js';

describe('pickErrorMessage', () => {
    test('handles missing or null data', () => {
        assert.strictEqual(pickErrorMessage(null, 'fallback'), 'fallback');
        assert.strictEqual(pickErrorMessage(undefined, 'fallback'), 'fallback');
    });

    test('handles FastAPI style errors (detail)', () => {
        assert.strictEqual(pickErrorMessage({ detail: 'Error message' }, 'fallback'), 'Error message');
        assert.strictEqual(pickErrorMessage({ detail: { msg: 'Complex error' } }, 'fallback'), '{"msg":"Complex error"}');
    });

    test('handles common API style errors', () => {
        assert.strictEqual(pickErrorMessage({ message: 'A message' }, 'fallback'), 'A message');
        assert.strictEqual(pickErrorMessage({ error: 'An error' }, 'fallback'), 'An error');
    });

    test('ignores non-string message or error fields', () => {
        assert.strictEqual(pickErrorMessage({ message: { msg: 'msg' } }, 'fallback'), '{"message":{"msg":"msg"}}');
        assert.strictEqual(pickErrorMessage({ error: 123 }, 'fallback'), '{"error":123}');
    });

    test('stringifies unhandled object structures', () => {
        assert.strictEqual(pickErrorMessage({ unknownField: 'test' }, 'fallback'), '{"unknownField":"test"}');
        assert.strictEqual(pickErrorMessage([1, 2, 3], 'fallback'), '[1,2,3]');
        assert.strictEqual(pickErrorMessage('raw text', 'fallback'), '"raw text"');
        assert.strictEqual(pickErrorMessage(123, 'fallback'), '123');
    });

    test('handles circular references by returning fallback', () => {
        const circularObj = {};
        circularObj.self = circularObj;
        assert.strictEqual(pickErrorMessage(circularObj, 'fallback'), 'fallback');
    });
});
