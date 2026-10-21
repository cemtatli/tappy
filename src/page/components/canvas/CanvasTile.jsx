import { memo, useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Checkbox } from '../ui/Checkbox.jsx';
import { displayUrl } from '../../lib/media.js';

function cleanText(text) {
  return (text ?? '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatCount(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

export const CanvasTile = memo(function CanvasTile({
  tile,
  image,
  selectionMode,
  selected,
  highlighted,
  onToggleSelect,
  onOpenLightbox,
}) {
  const [loadState, setLoadState] = useState('loading');
  const isExtraFrame = (image.mediaIndex ?? 0) > 0;
  const text = isExtraFrame
    ? image.authorName || ''
    : cleanText(image.text) || image.authorName || '';
  const loaded = loadState === 'loaded';

  function activate(rect) {
    if (selectionMode) {
      onToggleSelect?.(image.imageKey);
    } else {
      onOpenLightbox?.(image, rect);
    }
  }

  return (
    <article
      data-canvas-card
      role="button"
      tabIndex={0}
      aria-label={
        selectionMode
          ? `Seç: ${text.slice(0, 60) || `@${image.authorHandle}`}`
          : text.slice(0, 80) || `@${image.authorHandle} görseli`
      }
      aria-pressed={selectionMode ? Boolean(selected) : undefined}
      className={cn(
        'canvas-card group absolute flex flex-col overflow-hidden rounded-[14px] border border-black/[0.06] bg-white outline-none',
        selected && 'ring-2 ring-accent ring-offset-2 ring-offset-surface-2',
        highlighted && 'canvas-card--focus'
      )}
      style={{ left: tile.x, top: tile.y, width: tile.w, height: tile.h }}
      onClick={(e) => activate(e.currentTarget.getBoundingClientRect())}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(e.currentTarget.getBoundingClientRect());
        }
      }}
    >
      <div
        className="relative overflow-hidden bg-[#efede7]"
        style={{ height: tile.imageH }}
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-[#e8e5dd]" />
        )}
        {loadState === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(145deg,#f1eee7,#e5e0d6)] text-[10.5px] font-medium text-muted">
            @{image.authorHandle}
          </div>
        )}
        <img
          src={displayUrl(image.url)}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoadState('loaded')}
          onError={() => setLoadState('error')}
          className={cn(
            'h-full w-full object-cover transition-[opacity,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]',
            loaded ? 'opacity-100' : 'opacity-0',
            'group-hover:scale-[1.015]'
          )}
        />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/[0.04]" />
        {(image.mediaCount ?? 1) > 1 && (
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/45 px-1.5 py-0.5 text-[9.5px] font-medium tabular-nums text-white backdrop-blur-sm">
            {image.mediaIndex + 1}/{image.mediaCount}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-3.5 pb-3 pt-3">
        <p
          className={cn(
            'line-clamp-3 text-[13px] font-semibold leading-[17px] tracking-[-0.005em] text-text',
            isExtraFrame && 'text-[12px] font-medium text-muted'
          )}
        >
          {text}
        </p>
        <div className="mt-auto flex items-center gap-1.5 pt-2 text-[10.5px] leading-none text-muted">
          <span className="truncate">@{image.authorHandle}</span>
          {(image.likeCount ?? 0) > 0 && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 tabular-nums">
              <Heart size={10} strokeWidth={2} />
              {formatCount(image.likeCount)}
            </span>
          )}
        </div>
      </div>

      {selectionMode && (
        <div className="pointer-events-none absolute inset-0 p-2.5">
          <span
            className="pointer-events-auto inline-flex rounded-[7px] bg-white/90 p-0.5 shadow-[0_2px_8px_rgba(28,27,24,0.18)]"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(image.imageKey)}
            />
          </span>
        </div>
      )}
    </article>
  );
});
