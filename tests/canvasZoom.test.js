import { describe, it, expect } from 'vitest';
import { reanchorPan } from '../src/page/lib/canvasZoom.js';

describe('reanchorPan', () => {
  const viewportH = 800;

  it('keeps the vertical center fraction when the world grows', () => {
    // pan.y = -1000 → görünür merkez world = 1000 + 400 = 1400
    // eski dünya 4000 → frac = 0.35; yeni dünya 8000 → merkez 2800
    // nextPanY = -(2800 - 400) = -2400
    expect(reanchorPan(-1000, viewportH, 4000, 8000)).toBe(-2400);
  });

  it('is symmetric for zoom-out (shrinking world)', () => {
    // frac 0.35 korunur: yeni dünya 2000 → merkez 700 → nextPanY = -(700-400)=-300
    expect(reanchorPan(-1000, viewportH, 4000, 2000)).toBe(-300);
  });

  it('returns 0 when the old world height is 0', () => {
    expect(reanchorPan(-500, viewportH, 0, 5000)).toBe(0);
  });

  it('keeps pan at top when already at top', () => {
    // pan.y = 0 → merkez world = 400 → frac = 400/4000 = 0.1
    // yeni dünya 8000 → merkez 800 → nextPanY = -(800-400) = -400
    expect(reanchorPan(0, viewportH, 4000, 8000)).toBe(-400);
  });
});
