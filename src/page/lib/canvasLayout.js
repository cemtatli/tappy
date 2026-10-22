export function layoutMasonry(images, opts) {
  const { columnWidth, gap, containerWidth, ratios } = opts;
  const columns = Math.max(1, Math.floor(containerWidth / (columnWidth + gap)));
  const colHeights = new Array(columns).fill(0);
  const tiles = [];

  for (const image of images) {
    let col = 0;
    for (let i = 1; i < columns; i += 1) {
      if (colHeights[i] < colHeights[col]) col = i;
    }
    const ratio = ratios.get(image.imageKey) ?? 1;
    const h = Math.round(columnWidth * ratio);
    const x = col * (columnWidth + gap);
    const y = colHeights[col];
    tiles.push({ imageKey: image.imageKey, x, y, w: columnWidth, h });
    colHeights[col] = y + h + gap;
  }

  const worldWidth = columns * columnWidth + (columns - 1) * gap;
  const worldHeight = Math.max(0, ...colHeights) - (images.length ? gap : 0);
  return { tiles, worldWidth, worldHeight, columns };
}

export function visibleTiles(tiles, viewport) {
  const vx2 = viewport.x + viewport.width;
  const vy2 = viewport.y + viewport.height;
  return tiles.filter((t) => {
    const tx2 = t.x + t.w;
    const ty2 = t.y + t.h;
    return t.x < vx2 && tx2 > viewport.x && t.y < vy2 && ty2 > viewport.y;
  });
}

// A coarse spatial hash keeps viewport queries proportional to the cards near
// the screen rather than to the whole collection. Tiles can span more than one
// cell; the query dedupes them before the exact intersection test.
const INDEX_CELL = 512;

export function createTileIndex(tiles, cellSize = INDEX_CELL) {
  const cells = new Map();
  tiles.forEach((tile, order) => {
    const x0 = Math.floor(tile.x / cellSize);
    const x1 = Math.floor((tile.x + tile.w) / cellSize);
    const y0 = Math.floor(tile.y / cellSize);
    const y1 = Math.floor((tile.y + tile.h) / cellSize);
    for (let cx = x0; cx <= x1; cx += 1) {
      for (let cy = y0; cy <= y1; cy += 1) {
        const key = `${cx}:${cy}`;
        const bucket = cells.get(key);
        if (bucket) bucket.push(order);
        else cells.set(key, [order]);
      }
    }
  });
  return { cellSize, cells, tiles };
}

export function visibleTilesFromIndex(index, viewport) {
  const x0 = Math.floor(viewport.x / index.cellSize);
  const x1 = Math.floor((viewport.x + viewport.width) / index.cellSize);
  const y0 = Math.floor(viewport.y / index.cellSize);
  const y1 = Math.floor((viewport.y + viewport.height) / index.cellSize);
  const orders = new Set();

  for (let cx = x0; cx <= x1; cx += 1) {
    for (let cy = y0; cy <= y1; cy += 1) {
      const bucket = index.cells.get(`${cx}:${cy}`);
      if (!bucket) continue;
      for (const order of bucket) orders.add(order);
    }
  }

  if (orders.size === 0) return [];
  const vx2 = viewport.x + viewport.width;
  const vy2 = viewport.y + viewport.height;
  return Array.from(orders)
    .sort((a, b) => a - b)
    .map((order) => index.tiles[order])
    .filter((t) => {
      const tx2 = t.x + t.w;
      const ty2 = t.y + t.h;
      return t.x < vx2 && tx2 > viewport.x && t.y < vy2 && ty2 > viewport.y;
    });
}

// FNV-1a: stable per-card jitter, so a card keeps its character across
// re-layouts without storing anything.
function hashKey(key) {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const CARD_WIDTHS = [200, 224, 248, 272];
const IMAGE_RATIOS = [0.62, 0.78, 1, 1.24];
const TITLE_LINE_HEIGHT = 17;
const FOOTER_BASE = 50;

function cleanText(text) {
  return (text ?? '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cardMetrics(image) {
  const hash = hashKey(image.imageKey);
  const width = CARD_WIDTHS[hash % CARD_WIDTHS.length];
  const ratio = IMAGE_RATIOS[(hash >>> 3) % IMAGE_RATIOS.length];
  const imageH = Math.min(300, Math.max(126, Math.round(width * ratio)));
  // Extra frames of a carousel carry the image, not a repeated caption.
  const isExtraFrame = (image.mediaIndex ?? 0) > 0;
  const text = isExtraFrame
    ? image.authorName || ''
    : cleanText(image.text) || image.authorName || '';
  const charsPerLine = Math.max(12, Math.floor((width - 28) / 6.6));
  const titleLines = Math.min(
    3,
    Math.max(1, Math.ceil(text.length / charsPerLine))
  );
  const height = imageH + FOOTER_BASE + titleLines * TITLE_LINE_HEIGHT;
  return { w: width, h: height, imageH, titleLines };
}

// Loose rows of varied-width cards with jitter in both axes. Every card stays
// inside its row cell, so the organic scatter never overlaps.
//
// Rows are centred on the origin and alternate below/above the first row. The
// newest row sits at the centre, and later rows grow outward in all four
// directions, so panning left, right, up or down always arrives at content.
export function layoutScatter(images, opts = {}) {
  const { rowWidth = 1720, gapX = 42, gapY = 58 } = opts;
  const rows = [];
  let row = [];
  let rowIndex = 0;
  let x = 0;

  function flushRow() {
    if (row.length === 0) return;
    const minX = Math.min(...row.map((entry) => entry.tile.x));
    const maxX = Math.max(...row.map((entry) => entry.tile.x + entry.tile.w));
    const height = Math.max(...row.map((entry) => entry.tile.h));
    const offsetX = -Math.round((minX + maxX) / 2);
    rows.push({
      height,
      tiles: row.map(({ tile, jitter }) => ({
        ...tile,
        x: tile.x + offsetX,
        jitter,
      })),
    });
    row = [];
    x = 0;
    rowIndex += 1;
  }

  for (const image of images) {
    const metrics = cardMetrics(image);
    if (x > 0 && x + metrics.w > rowWidth) flushRow();
    if (row.length === 0) x = (rowIndex % 4) * 22;
    const hash = hashKey(image.imageKey);
    const jx = hash % 17;
    row.push({
      tile: {
        imageKey: image.imageKey,
        x: x + jx,
        y: 0,
        w: metrics.w,
        h: metrics.h,
        imageH: metrics.imageH,
      },
      jitter: ((hash >>> 8) % 1000) / 1000,
    });
    x += metrics.w + gapX + ((hash >>> 4) % 13);
    if (x >= rowWidth) {
      flushRow();
    }
  }
  flushRow();

  const tiles = [];
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  let maxY = 0;

  if (rows.length > 0) {
    const firstTop = -Math.round(rows[0].height / 2);
    let below = firstTop + rows[0].height + gapY;
    let above = firstTop - gapY;

    rows.forEach((entry, index) => {
      let top;
      if (index === 0) {
        top = firstTop;
      } else if (index % 2 === 1) {
        top = below;
        below += entry.height + gapY;
      } else {
        top = above - entry.height;
        above = top - gapY;
      }

      for (const tile of entry.tiles) {
        const slack = Math.max(0, entry.height - tile.h);
        const placed = {
          imageKey: tile.imageKey,
          x: tile.x,
          y: Math.round(top + slack * tile.jitter),
          w: tile.w,
          h: tile.h,
          imageH: tile.imageH,
        };
        tiles.push(placed);
        minX = Math.min(minX, placed.x);
        maxX = Math.max(maxX, placed.x + placed.w);
        minY = Math.min(minY, placed.y);
        maxY = Math.max(maxY, placed.y + placed.h);
      }
    });
  }

  return {
    tiles,
    worldWidth: maxX - minX,
    worldHeight: maxY - minY,
    minX,
    minY,
    maxX,
    maxY,
  };
}
