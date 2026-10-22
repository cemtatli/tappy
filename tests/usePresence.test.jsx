// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useExitPresence } from '../src/page/lib/usePresence.js';

function Surface({ open, exitMs = 160 }) {
  const { mounted, closing } = useExitPresence(open, exitMs);
  if (!mounted) return null;
  return <div data-testid="surface" data-closing={String(closing)} />;
}

describe('useExitPresence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a closing surface mounted until its exit finishes', () => {
    const { rerender } = render(<Surface open />);
    expect(screen.getByTestId('surface').getAttribute('data-closing')).toBe(
      'false'
    );

    rerender(<Surface open={false} />);
    expect(screen.getByTestId('surface').getAttribute('data-closing')).toBe(
      'true'
    );

    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(screen.queryByTestId('surface')).toBeNull();
  });

  it('shows the surface on the first open without waiting for an effect', () => {
    const { rerender } = render(<Surface open={false} />);
    expect(screen.queryByTestId('surface')).toBeNull();

    rerender(<Surface open />);
    expect(screen.getByTestId('surface')).toBeTruthy();
  });
});
