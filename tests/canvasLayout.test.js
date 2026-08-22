import { describe, it, expect } from 'vitest';
import { layoutMasonry, visibleTiles } from '../src/page/lib/canvasLayout.js';

const imgs = [
  { imageKey: 'a' },
  { imageKey: 'b' },
  { imageKey: 'c' },
  { imageKey: 'd' },
];

describe('layoutMasonry', () => {
  it('packs into shortest column, computes world size', () => {
    const ratios = new Map([
      ['a', 1],
      ['b', 2],
      ['c', 1],
      ['d', 1],
    ]);
    const layout = layoutMasonry(imgs, {
      columnWidth: 100,
      gap: 10,
      containerWidth: 320, // (100+10)*2 + slack -> 2 columns
      ratios,
    });
    expect(layout.columns).toBe(2);
    expect(layout.tiles).toHaveLength(4);
    // First two tiles head each column at y=0
    const a = layout.tiles.find((t) => t.imageKey === 'a');
    const b = layout.tiles.find((t) => t.imageKey === 'b');
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    expect(a.h).toBe(100); // ratio 1 * width 100
    expect(b.x).toBe(110); // column 2
    expect(b.h).toBe(200); // ratio 2
    // 'c' goes under 'a' (shorter column) at y = 100 + gap
    const c = layout.tiles.find((t) => t.imageKey === 'c');
    expect(c.x).toBe(0);
    expect(c.y).toBe(110);
    expect(layout.worldWidth).toBe(210); // 2*100 + 10 gap
  });

  it('defaults ratio to 1 when unknown', () => {
    const layout = layoutMasonry([{ imageKey: 'x' }], {
      columnWidth: 100,
      gap: 10,
      containerWidth: 100,
      ratios: new Map(),
    });
    expect(layout.tiles[0].h).toBe(100);
  });
});

describe('visibleTiles', () => {
  it('returns only intersecting tiles', () => {
    const tiles = [
      { imageKey: 'a', x: 0, y: 0, w: 100, h: 100 },
      { imageKey: 'b', x: 0, y: 500, w: 100, h: 100 },
    ];
    const vis = visibleTiles(tiles, { x: 0, y: 0, width: 200, height: 200 });
    expect(vis.map((t) => t.imageKey)).toEqual(['a']);
  });
});
