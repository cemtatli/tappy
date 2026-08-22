export function panBounds({
  worldWidth,
  worldHeight,
  viewportWidth,
  viewportHeight,
  zoom,
  margin = 48,
}) {
  const worldW = worldWidth * zoom;
  const worldH = worldHeight * zoom;
  const axis = (world, viewport) => {
    if (world <= viewport) {
      const centered = (viewport - world) / 2;
      return { min: centered, max: centered };
    }
    return { min: viewport - world - margin, max: margin };
  };
  const x = axis(worldW, viewportWidth);
  const y = axis(worldH, viewportHeight);
  return { minX: x.min, maxX: x.max, minY: y.min, maxY: y.max };
}

export function clampPan(pan, bounds) {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, pan.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, pan.y)),
  };
}

export function rubberBand(value, min, max, resistance) {
  if (value > max) return max + (value - max) * resistance;
  if (value < min) return min + (value - min) * resistance;
  return value;
}
