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
