import { describe, it, expect } from 'vitest';
import { nextViewFromKey } from '../src/page/lib/shortcuts.js';

describe('nextViewFromKey', () => {
  it('maps g/c to views', () => {
    expect(nextViewFromKey('g', { typing: false, hasModifier: false })).toBe(
      'grid'
    );
    expect(nextViewFromKey('C', { typing: false, hasModifier: false })).toBe(
      'canvas'
    );
  });
  it('ignores while typing or with modifier or other keys', () => {
    expect(
      nextViewFromKey('g', { typing: true, hasModifier: false })
    ).toBeNull();
    expect(
      nextViewFromKey('g', { typing: false, hasModifier: true })
    ).toBeNull();
    expect(
      nextViewFromKey('x', { typing: false, hasModifier: false })
    ).toBeNull();
  });
});
