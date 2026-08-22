const COLORS = [
  '#1d9bf0',
  '#00ba7c',
  '#f91880',
  '#ffd400',
  '#7856ff',
  '#ff7a00',
];

function colorFor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

// X serves a generic grey "default_profile" image for avatar-less users. It sits
// outside our CSP allowlist, so fall back to the coloured initial instead.
export function isUsableAvatar(src) {
  return Boolean(src) && !src.includes('default_profile');
}

export function Avatar({ name = '', src = null, size = 40 }) {
  if (isUsableAvatar(src)) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        className="shrink-0 self-start rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <div
      aria-label={name || 'Avatar'}
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-black"
      style={{
        width: size,
        height: size,
        backgroundColor: colorFor(name),
        fontSize: size * 0.45,
      }}
    >
      {initial}
    </div>
  );
}
