import { describe, it, expect } from 'vitest';
import {
  COLLECTION_COLORS,
  DEFAULT_COLLECTION_COLOR,
  isValidColor,
} from '../src/page/lib/collectionColors.js';

describe('collection colors', () => {
  it('has 8 colors and a valid default', () => {
    expect(COLLECTION_COLORS).toHaveLength(8);
    expect(COLLECTION_COLORS).toContain(DEFAULT_COLLECTION_COLOR);
  });
  it('validates membership', () => {
    expect(isValidColor('#0071e3')).toBe(true);
    expect(isValidColor('#123456')).toBe(false);
  });
});
