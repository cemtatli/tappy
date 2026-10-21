export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 2.6;

export function clampZoom(value) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

// Zoom reflows the masonry rather than scaling it: the column count changes, so
// the world height changes too. reanchorPan preserves the viewport's vertical
// centre as a ratio, keeping what you look at fixed while zooming. Only pan.y
// matters here — horizontal position is handled by clampPan.
export function reanchorPan(
  panY,
  viewportHeight,
  oldWorldHeight,
  newWorldHeight
) {
  if (oldWorldHeight <= 0) return 0;
  const centerWorld = -panY + viewportHeight / 2;
  const frac = centerWorld / oldWorldHeight;
  const nextCenter = frac * newWorldHeight;
  return -(nextCenter - viewportHeight / 2);
}
