import { describe, it, expect } from 'vitest';
import { addToast, removeToast } from '../src/page/lib/toasts.js';

describe('addToast', () => {
  it('appends the toast to the end', () => {
    const a = { id: 1, type: 'success', message: 'a' };
    const b = { id: 2, type: 'error', message: 'b' };
    expect(addToast([a], b)).toEqual([a, b]);
  });

  it('does not mutate the input list', () => {
    const list = [{ id: 1, type: 'info', message: 'x' }];
    addToast(list, { id: 2, type: 'info', message: 'y' });
    expect(list).toHaveLength(1);
  });
});

describe('removeToast', () => {
  it('removes the toast with the given id', () => {
    const list = [
      { id: 1, type: 'success', message: 'a' },
      { id: 2, type: 'error', message: 'b' },
    ];
    expect(removeToast(list, 1)).toEqual([
      { id: 2, type: 'error', message: 'b' },
    ]);
  });

  it('keeps the list unchanged when id not found', () => {
    const list = [{ id: 1, type: 'info', message: 'a' }];
    expect(removeToast(list, 99)).toEqual(list);
  });
});
