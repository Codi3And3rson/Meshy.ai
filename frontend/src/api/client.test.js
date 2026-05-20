import { describe, it, expect } from 'vitest';
import { pickErrorMessage } from './client.js';

describe('pickErrorMessage', () => {
    const fallback = 'Default Error';

    it('returns fallback when data is null or undefined', () => {
        expect(pickErrorMessage(null, fallback)).toBe(fallback);
        expect(pickErrorMessage(undefined, fallback)).toBe(fallback);
    });

    it('returns detail string for FastAPI style', () => {
        const data = { detail: 'Not Found' };
        expect(pickErrorMessage(data, fallback)).toBe('Not Found');
    });

    it('returns stringified detail object for FastAPI style', () => {
        const data = { detail: { loc: ['body', 'field'], msg: 'field required' } };
        expect(pickErrorMessage(data, fallback)).toBe(JSON.stringify(data.detail));
    });

    it('returns message string for common API style', () => {
        const data = { message: 'Invalid token' };
        expect(pickErrorMessage(data, fallback)).toBe('Invalid token');
    });

    it('returns error string for common API style', () => {
        const data = { error: 'Unauthorized' };
        expect(pickErrorMessage(data, fallback)).toBe('Unauthorized');
    });

    it('returns stringified object for other formats', () => {
        const data = { unknownField: 'some error info' };
        expect(pickErrorMessage(data, fallback)).toBe(JSON.stringify(data));
    });

    it('returns fallback when JSON stringification fails', () => {
        const circularObj = {};
        circularObj.self = circularObj;

        expect(pickErrorMessage(circularObj, fallback)).toBe(fallback);
    });
});
