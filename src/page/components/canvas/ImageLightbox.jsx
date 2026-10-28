import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Button } from '../ui/Button.jsx';

const actionButton = 'size-9 min-w-9 px-0 text-text/80 hover:text-text';
const ICON = 17;

function Divider() {
  return (
    <span aria-hidden="true" className="mx-auto h-px w-5 bg-black/[0.08]" />
  );
}

// Must match the lightbox-out keyframe duration (--dur-base) in app.css.
const EXIT_MS = 200;

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
  reservedRight = 0,
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
  const [closing, setClosing] = useState(false);
  const closeTimerRef = useRef(0);

  // Let the exit play out before the parent hides us. Guarded so a second press
  // during the exit does not queue a second close. `closing` is cleared in the
  // same tick as onClose because this component stays mounted between opens —
  // leaving it set would render the next open at the exit's final opacity: 0.
  const startClose = useCallback(() => {
    if (closeTimerRef.current) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = 0;
      setClosing(false);
      onClose();
    }, EXIT_MS);
  }, [onClose]);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  useEffect(() => {
    setActiveIndex(initialIndex);
  }, [initialKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOpen = images && images.length > 0;

  useEffect(() => {
    const h = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        startClose();
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
  }, [startClose, isOpen, images]);

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
      data-closing={closing ? 'true' : undefined}
      className={`fixed inset-0 z-50 bg-surface-2/70 backdrop-blur-2xl backdrop-saturate-150 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)] ${
        closing
          ? 'opacity-0'
          : 'animate-[fade-in_var(--dur-base)_var(--ease-out)] opacity-100'
      }`}
      onClick={startClose}
    >
      <div
        data-testid="lightbox-stage"
        className="flex h-full w-full items-center justify-center transition-[padding-right] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
        style={{ paddingRight: `${reservedRight}px` }}
      >
        <div
          className={`flex flex-col items-center gap-3 ${closing ? 'animate-[lightbox-out_var(--dur-base)_var(--ease-out)_forwards]' : 'animate-[lightbox-in_var(--dur-base)_var(--ease-out)]'}`}
          style={{ transformOrigin: origin }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image + action bar side by side */}
          <div className="flex items-center justify-center gap-4">
            {/* Main image */}
            <img
              key={active.imageKey}
              src={active.url}
              alt=""
              style={{ maxWidth: `calc((100vw - ${reservedRight}px) * 0.72)` }}
              className="lightbox-image max-h-[78vh] rounded-[20px] object-contain"
            />

            {/* Right vertical action bar — sibling of the image, not overlapping */}
            <div className="lightbox-actions glass flex flex-col gap-1 rounded-full p-1.5">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Favori"
                aria-pressed={isFavorited}
                title="Favori"
                onClick={() => onToggleFavorite?.(active)}
                className={`${actionButton} ${isFavorited ? 'glass-thumb text-[#ff2d55] hover:text-[#ff2d55]' : ''}`}
              >
                <Heart
                  size={ICON}
                  className={`transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isFavorited ? 'scale-110 fill-current' : ''}`}
                />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                aria-label="Koleksiyona ekle"
                title="Koleksiyona ekle"
                onClick={() => onAddToCollection?.(active)}
                className={actionButton}
              >
                <FolderPlus size={ICON} />
              </Button>

              <Divider />

              <Button
                variant="ghost"
                size="sm"
                aria-label="Kopyala"
                title="Kopyala"
                onClick={() => copyImageToClipboard(active.url)}
                className={actionButton}
              >
                <Copy size={ICON} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                aria-label="İndir"
                title="İndir"
                onClick={() =>
                  downloadImage(
                    active.url,
                    `${active.authorHandle}-${active.tweetId}-${active.mediaIndex}.${extFromUrl(active.url)}`
                  )
                }
                className={actionButton}
              >
                <Download size={ICON} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                aria-label="Önizleme"
                title="Önizleme"
                onClick={() => onPreview?.(active)}
                className={actionButton}
              >
                <PanelRight size={ICON} />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                asChild
                className={actionButton}
              >
                <a
                  href={active.tweetUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Tweet'i aç"
                  title="Tweet'i aç"
                >
                  <ExternalLink size={ICON} />
                </a>
              </Button>

              <Divider />

              <Button
                variant="ghost"
                size="sm"
                aria-label="Unmark"
                title="Unmark"
                onClick={() => onUnmark?.(active.tweetId)}
                className={`${actionButton} text-danger hover:bg-danger/10 hover:text-danger`}
              >
                <Trash2 size={ICON} />
              </Button>

              <Button
                ref={closeRef}
                variant="ghost"
                size="sm"
                aria-label="Kapat"
                title="Kapat"
                onClick={startClose}
                className={actionButton}
              >
                <X size={ICON} />
              </Button>
            </div>
          </div>

          {/* Bottom related-images strip (only when tweet has multiple images) */}
          {images.length > 1 && (
            <div
              style={{ maxWidth: `calc((100vw - ${reservedRight}px) * 0.74)` }}
              className="glass flex gap-1.5 overflow-x-auto rounded-[18px] p-1.5"
            >
              {images.map((img, i) => (
                <button
                  key={img.imageKey}
                  type="button"
                  aria-label={`Görsel ${i + 1}`}
                  onClick={() => setActiveIndex(i)}
                  aria-current={i === activeIndex ? 'true' : undefined}
                  className={`press h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl ${
                    i === activeIndex
                      ? 'opacity-100 shadow-[0_0_0_2px_#fff,0_0_0_3.5px_rgb(29_29_31/0.55)]'
                      : 'opacity-55 hover:opacity-90'
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
    </div>
  );
}
