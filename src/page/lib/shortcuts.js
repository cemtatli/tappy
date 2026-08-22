export function nextViewFromKey(key, { typing, hasModifier }) {
  if (typing || hasModifier) return null;
  const k = String(key).toLowerCase();
  if (k === 'g') return 'grid';
  if (k === 'c') return 'canvas';
  return null;
}
