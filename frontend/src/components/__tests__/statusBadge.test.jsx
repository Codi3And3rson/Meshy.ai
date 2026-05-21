import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { statusBadge } from '../statusBadge';

describe('statusBadge', () => {
    it('returns SUCCEEDED badge for status containing SUCC', () => {
        const { container } = render(statusBadge('SUCCESS'));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-success');
        expect(span.textContent).toBe('SUCCEEDED');
    });

    it('returns FAILED badge for status containing FAIL', () => {
        const { container } = render(statusBadge('FAILED'));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-danger');
        expect(span.textContent).toBe('FAILED');
    });

    it('returns RUNNING badge for status containing RUN', () => {
        const { container } = render(statusBadge('RUNNING'));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-warn');
        expect(span.textContent).toBe('RUNNING');
    });

    it('returns RUNNING badge for status containing PROC', () => {
        const { container } = render(statusBadge('PROCESSING'));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-warn');
        expect(span.textContent).toBe('RUNNING');
    });

    it('returns default badge for unknown status', () => {
        const { container } = render(statusBadge('PENDING'));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-def');
        expect(span.textContent).toBe('PENDING');
    });

    it('returns UNKNOWN default badge for null/undefined status', () => {
        const { container } = render(statusBadge(null));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-def');
        expect(span.textContent).toBe('UNKNOWN');
    });

    it('is case insensitive', () => {
        const { container } = render(statusBadge('success'));
        const span = container.firstChild;
        expect(span.className).toBe('badge badge-success');
        expect(span.textContent).toBe('SUCCEEDED');
    });
});
