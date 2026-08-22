import { memo, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { Checkbox } from '../ui/Checkbox.jsx';
import { displayUrl } from '../../lib/media.js';

export const CanvasTile = memo(function CanvasTile({
  tile,
  image,
  selectionMode,
  selected,
  onToggleSelect,
  onOpenLightbox,
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className="group absolute overflow-hidden rounded-lg border border-line bg-surface transition-[transform,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
      style={{ left: tile.x, top: tile.y, width: tile.w, height: tile.h }}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-surface-2" />
      )}
      <img
        src={displayUrl(image.url)}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => setLoaded(true)}
        onClick={(e) =>
          selectionMode
            ? onToggleSelect(image.imageKey)
            : onOpenLightbox?.(image, e.currentTarget.getBoundingClientRect())
        }
        className={cn(
          'h-full w-full cursor-pointer object-cover transition-opacity duration-[var(--dur-base)]',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
      {selectionMode && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 flex items-start justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100',
            selected && 'opacity-100'
          )}
        >
          <span
            className="pointer-events-auto"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(image.imageKey)}
            />
          </span>
        </div>
      )}
    </div>
  );
});
