import { useEffect, useRef, useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Download,
  Heart,
  FolderPlus,
  Trash2,
  PanelRight,
} from 'lucide-react';
import {
  copyImageToClipboard,
  downloadImage,
  extFromUrl,
} from '../../lib/media.js';

export function ImageLightbox({
  images,
  initialKey,
  originRect,
  favoriteKeys,
  onToggleFavorite,
  onAddToCollection,
  onPreview,
  onUnmark,
  onClose,
}) {
  const closeRef = useRef(null);
  const previousFocusRef = useRef(null);

  const initialIndex =
    images && initialKey
      ? Math.max(
          images.findIndex((img) => img.imageKey === initialKey),
          0
        )
      : 0;

  const [activeIndex, setActiveIndex] = useState(initialIndex);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOpen = images && images.length > 0;

  useEffect(() => {
    const h = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const len = images.length;
      if (len < 2) return;
      if (e.key === 'ArrowRight') setActiveIndex((i) => (i + 1) % len);
      else if (e.key === 'ArrowLeft')
        setActiveIndex((i) => (i - 1 + len) % len);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, isOpen, images]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      closeRef.current?.focus();
    } else {
      if (
        previousFocusRef.current &&
        typeof previousFocusRef.current.focus === 'function'
      ) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const active = images[activeIndex];

  const origin = originRect
    ? `${originRect.x + originRect.width / 2}px ${originRect.y + originRect.height / 2}px`
    : 'center';

  const isFavorited = favoriteKeys?.has(active.imageKey) ?? false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Resim önizleme"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex flex-col items-center gap-3 motion-safe:animate-[lightbox-in_var(--dur-base)_var(--ease-out)]"
        style={{ transformOrigin: origin }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image + action bar side by side */}
        <div className="flex items-center justify-center gap-4">
          {/* Main image */}
          <img
            src={active.url}
            alt=""
            className="max-h-[78vh] max-w-[68vw] rounded-[var(--radius)] object-contain shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
          />

          {/* Right vertical action bar — sibling of the image, not overlapping */}
          <div className="flex flex-col gap-2 rounded-full border border-line bg-white/70 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
            {/* Favori */}
            <button
              type="button"
              aria-label="Favori"
              title="Favori"
              onClick={() => onToggleFavorite?.(active)}
              className={`rounded-full p-1.5 hover:bg-black/5 ${isFavorited ? 'text-danger' : ''}`}
            >
              <Heart size={16} className={isFavorited ? 'fill-current' : ''} />
            </button>

            {/* Koleksiyona ekle */}
            <button
              type="button"
              aria-label="Koleksiyona ekle"
              title="Koleksiyona ekle"
              onClick={() => onAddToCollection?.(active)}
              className="rounded-full p-1.5 hover:bg-black/5"
            >
              <FolderPlus size={16} />
            </button>

            {/* Kopyala */}
            <button
              type="button"
              aria-label="Kopyala"
              title="Kopyala"
              onClick={() => copyImageToClipboard(active.url)}
              className="rounded-full p-1.5 hover:bg-black/5"
            >
              <Copy size={16} />
            </button>

            {/* İndir */}
            <button
              type="button"
              aria-label="İndir"
              title="İndir"
              onClick={() =>
                downloadImage(
                  active.url,
                  `${active.authorHandle}-${active.tweetId}-${active.mediaIndex}.${extFromUrl(active.url)}`
                )
              }
              className="rounded-full p-1.5 hover:bg-black/5"
            >
              <Download size={16} />
            </button>

            {/* Unmark */}
            <button
              type="button"
              aria-label="Unmark"
              title="Unmark"
              onClick={() => onUnmark?.(active.tweetId)}
              className="rounded-full p-1.5 text-danger hover:bg-black/5"
            >
              <Trash2 size={16} />
            </button>

            {/* Önizleme */}
            <button
              type="button"
              aria-label="Önizleme"
              title="Önizleme"
              onClick={() => onPreview?.(active)}
              className="rounded-full p-1.5 hover:bg-black/5"
            >
              <PanelRight size={16} />
            </button>

            {/* Tweet'i aç */}
            <a
              href={active.tweetUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Tweet'i aç"
              title="Tweet'i aç"
              className="rounded-full p-1.5 hover:bg-black/5"
            >
              <ExternalLink size={16} />
            </a>

            {/* Kapat */}
            <button
              ref={closeRef}
              type="button"
              aria-label="Kapat"
              title="Kapat"
              onClick={onClose}
              className="rounded-full p-1.5 hover:bg-black/5"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Bottom related-images strip (only when tweet has multiple images) */}
        {images.length > 1 && (
          <div className="flex max-w-[74vw] gap-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={img.imageKey}
                type="button"
                aria-label={`Görsel ${i + 1}`}
                onClick={() => setActiveIndex(i)}
                className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-line ${
                  i === activeIndex ? 'ring-2 ring-accent' : ''
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
