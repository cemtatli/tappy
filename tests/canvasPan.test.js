import { describe, it, expect } from 'vitest';
import { panBounds, clampPan, rubberBand } from '../src/page/lib/canvasPan.js';

describe('panBounds', () => {
  it('lets content larger than viewport pan within a margin', () => {
    const b = panBounds({
      worldWidth: 1000,
      worldHeight: 800,
      viewportWidth: 400,
      viewportHeight: 300,
      zoom: 1,
      margin: 48,
    });
    // maxX/maxY = margin (can nudge content down-right by margin)
    expect(b.maxX).toBe(48);
    expect(b.maxY).toBe(48);
    // minX = viewport - world*zoom - margin = 400 - 1000 - 48 = -648
    expect(b.minX).toBe(-648);
    expect(b.minY).toBe(300 - 800 - 48);
  });

  it('centers content smaller than the viewport (min === max)', () => {
    const b = panBounds({
      worldWidth: 200,
      worldHeight: 100,
      viewportWidth: 400,
      viewportHeight: 300,
      zoom: 1,
      margin: 48,
    });
    expect(b.minX).toBe(b.maxX);
    expect(b.minX).toBe((400 - 200) / 2);
    expect(b.minY).toBe((300 - 100) / 2);
  });
});

describe('clampPan', () => {
  it('clamps to bounds', () => {
    const bounds = { minX: -100, maxX: 0, minY: -50, maxY: 0 };
    expect(clampPan({ x: 20, y: -80 }, bounds)).toEqual({ x: 0, y: -50 });
    expect(clampPan({ x: -30, y: -10 }, bounds)).toEqual({ x: -30, y: -10 });
  });
});

describe('rubberBand', () => {
  it('returns value unchanged within range', () => {
    expect(rubberBand(-30, -100, 0, 0.3)).toBe(-30);
  });
  it('applies resistance past the max', () => {
    // 20 past max(0): 0 + 20*0.3 = 6
    expect(rubberBand(20, -100, 0, 0.3)).toBeCloseTo(6);
  });
  it('applies resistance past the min', () => {
    // -120 is 20 past min(-100): -100 + (-20*0.3) = -106
    expect(rubberBand(-120, -100, 0, 0.3)).toBeCloseTo(-106);
  });
});
