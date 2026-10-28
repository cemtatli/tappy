import { describe, it, expect } from 'vitest';
import {
  createTileIndex,
  layoutMasonry,
  layoutScatter,
  visibleCopies,
  visibleTiles,
  visibleTilesFromIndex,
} from '../src/page/lib/canvasLayout.js';

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

describe('layoutScatter', () => {
  it('centres a lone card on the origin', () => {
    const layout = layoutScatter([
      { imageKey: 'solo', text: 'tek', authorName: 'cem' },
    ]);
    expect(layout.tiles).toHaveLength(1);
    const [tile] = layout.tiles;
    expect(Math.abs(tile.x + tile.w / 2)).toBeLessThanOrEqual(1);
    expect(Math.abs(tile.y + tile.h / 2)).toBeLessThanOrEqual(1);
    expect(layout.worldWidth).toBe(tile.w);
    expect(layout.worldHeight).toBe(tile.h);
  });

  it('grows in all four directions from the newest row', () => {
    const images = Array.from({ length: 120 }, (_, index) => ({
      imageKey: `image-${index}`,
      text: `Bookmark ${index} ${'metin '.repeat(index % 7)}`,
      authorName: `user${index}`,
    }));
    const layout = layoutScatter(images);
    expect(layout.tiles).toHaveLength(images.length);
    expect(layout.tiles.some((tile) => tile.x < 0)).toBe(true);
    expect(layout.tiles.some((tile) => tile.x > 0)).toBe(true);
    expect(layout.tiles.some((tile) => tile.y < 0)).toBe(true);
    expect(layout.tiles.some((tile) => tile.y > 0)).toBe(true);
    expect(layout.minX).toBeLessThan(0);
    expect(layout.minY).toBeLessThan(0);
    expect(layout.maxX).toBeGreaterThan(0);
    expect(layout.maxY).toBeGreaterThan(0);
  });

  it('keeps a large world roughly square', () => {
    const images = Array.from({ length: 2000 }, (_, index) => ({
      imageKey: `image-${index}`,
      text: `Bookmark ${index}`,
      authorName: `user${index}`,
    }));
    const layout = layoutScatter(images);
    const aspect = layout.worldWidth / layout.worldHeight;
    expect(aspect).toBeGreaterThan(0.6);
    expect(aspect).toBeLessThan(1.6);
  });
});

describe('visibleCopies', () => {
  const layout = {
    minX: 0,
    minY: 0,
    periodX: 1000,
    periodY: 1000,
  };
  const tiles = [{ imageKey: 'a', x: 100, y: 100, w: 100, h: 100 }];
  const index = createTileIndex(tiles, 512);

  it('returns the original copy inside the world', () => {
    const copies = visibleCopies(
      index,
      { x: 0, y: 0, width: 500, height: 500 },
      layout
    );
    expect(copies).toEqual([{ key: '0:0', dx: 0, dy: 0, tiles }]);
  });

  it('finds content past every edge of the world', () => {
    const left = visibleCopies(
      index,
      { x: -950, y: 0, width: 500, height: 500 },
      layout
    );
    expect(left.map((copy) => copy.key)).toEqual(['-1:0']);
    expect(left[0].tiles[0]).toBe(tiles[0]);

    const farUp = visibleCopies(
      index,
      { x: 5000, y: -7000, width: 500, height: 500 },
      layout
    );
    expect(farUp.map((copy) => [copy.dx, copy.dy])).toEqual([[5000, -7000]]);
  });

  it('returns one copy per period across a wide viewport', () => {
    const copies = visibleCopies(
      index,
      { x: 0, y: 0, width: 2500, height: 500 },
      layout
    );
    expect(copies.map((copy) => copy.key)).toEqual(['0:0', '1:0', '2:0']);
  });
});

describe('createTileIndex', () => {
  const tiles = [
    { imageKey: 'a', x: -620, y: -620, w: 100, h: 100 },
    { imageKey: 'b', x: 20, y: 20, w: 100, h: 100 },
    { imageKey: 'c', x: 1200, y: 1200, w: 100, h: 100 },
  ];

  it('returns only tiles intersecting the viewport', () => {
    const index = createTileIndex(tiles, 512);
    const vis = visibleTilesFromIndex(index, {
      x: -700,
      y: -700,
      width: 300,
      height: 300,
    });
    expect(vis.map((tile) => tile.imageKey)).toEqual(['a']);
  });

  it('dedupes a tile that spans multiple cells', () => {
    const index = createTileIndex(
      [{ imageKey: 'big', x: -300, y: -300, w: 900, h: 900 }],
      128
    );
    const vis = visibleTilesFromIndex(index, {
      x: -350,
      y: -350,
      width: 1000,
      height: 1000,
    });
    expect(vis.map((tile) => tile.imageKey)).toEqual(['big']);
  });

  it('keeps layout order for a wide viewport', () => {
    const index = createTileIndex(tiles, 128);
    const vis = visibleTilesFromIndex(index, {
      x: -700,
      y: -700,
      width: 2200,
      height: 2200,
    });
    expect(vis.map((tile) => tile.imageKey)).toEqual(['a', 'b', 'c']);
  });
});
