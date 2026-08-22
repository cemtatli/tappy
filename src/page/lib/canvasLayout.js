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
