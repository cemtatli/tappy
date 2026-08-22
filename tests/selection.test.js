// tests/selection.test.js
import { describe, it, expect } from 'vitest';
import {
  createSelectionState,
  toggleSelection,
  selectAll,
  clearSelection,
} from '../src/page/selection.js';

describe('selection', () => {
  it('createSelectionState starts empty', () => {
    expect(createSelectionState().size).toBe(0);
  });

  it('toggleSelection adds then removes an id, without mutating input', () => {
    const s0 = createSelectionState();
    const s1 = toggleSelection(s0, '1');
    expect(s1.has('1')).toBe(true);
    expect(s0.has('1')).toBe(false);
    const s2 = toggleSelection(s1, '1');
    expect(s2.has('1')).toBe(false);
  });

  it('selectAll returns a set of the given ids', () => {
    expect(selectAll(['1', '2', '2'])).toEqual(new Set(['1', '2']));
  });

  it('clearSelection returns an empty set', () => {
    expect(clearSelection().size).toBe(0);
  });
});
