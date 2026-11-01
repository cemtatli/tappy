import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { History } from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { CanvasTile } from './CanvasTile.jsx';

const MIN_COLUMN_WIDTH = 240;
const GAP = 20;
const SIDE_PADDING = 24;
const MAX_WIDTH = 1680;
// Clears the fixed header above and the search dock below.
const TOP_PADDING = 84;
const BOTTOM_PADDING = 112;
const IMAGE_RATIO = 0.75;
// Room for the three-line caption and the meta row the tile renders.
const FOOTER_HEIGHT = 104;
const HIGHLIGHT_MS = 3200;

export function gridMetrics(viewportWidth) {
  const width =
    Math.min(viewportWidth, MAX_WIDTH + SIDE_PADDING * 2) - SIDE_PADDING * 2;
  const columns = Math.max(
    1,
    Math.floor((width + GAP) / (MIN_COLUMN_WIDTH + GAP))
  );
  const cardWidth = Math.floor((width - GAP * (columns - 1)) / columns);
  const imageH = Math.round(cardWidth * IMAGE_RATIO);
  return {
    columns,
    cardWidth,
    imageH,
    cardHeight: imageH + FOOTER_HEIGHT,
    contentWidth: columns * cardWidth + GAP * (columns - 1),
  };
}

export function ImageGrid({
  images,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpenLightbox,
  focusRequest,
  viewKey,
  onLoadOlder,
  loadingOlder,
}) {
  const scrollRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(
    () => window.innerWidth || 1000
  );
  const [focusedKey, setFocusedKey] = useState(null);
  const highlightTimerRef = useRef(0);
  const focusHandledRef = useRef(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const update = () => setViewportWidth(el.clientWidth || window.innerWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const metrics = useMemo(() => gridMetrics(viewportWidth), [viewportWidth]);
  const { columns, cardWidth, cardHeight, imageH, contentWidth } = metrics;
  const rowCount = Math.ceil(images.length / columns);

  // One stable tile per column keeps CanvasTile's memo effective while scrolling.
  const columnTiles = useMemo(
    () =>
      Array.from({ length: columns }, (_, column) => ({
        x: column * (cardWidth + GAP),
        y: 0,
        w: cardWidth,
        h: cardHeight,
        imageH,
      })),
    [columns, cardWidth, cardHeight, imageH]
  );

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => cardHeight + GAP,
    paddingStart: TOP_PADDING,
    paddingEnd: 0,
    overscan: 2,
    // jsdom measures everything as 0px; a seed rect lets tests render rows.
    initialRect: { width: 1000, height: 800 },
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, cardHeight]);

  const prevViewKeyRef = useRef(viewKey);
  useEffect(() => {
    if (prevViewKeyRef.current === viewKey) return;
    prevViewKeyRef.current = viewKey;
    setFocusedKey(null);
    scrollRef.current?.scrollTo?.({ top: 0 });
  }, [viewKey]);

  useEffect(() => {
    if (!focusRequest || focusHandledRef.current === focusRequest.nonce) return;
    focusHandledRef.current = focusRequest.nonce;

    if (focusRequest.type === 'home') {
      setFocusedKey(null);
      scrollRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' });
      return;
    }

    const index = images.findIndex(
      (image) => image.imageKey === focusRequest.imageKey
    );
    if (index === -1) return;
    virtualizer.scrollToIndex(Math.floor(index / columns), {
      align: 'center',
    });
    setFocusedKey(focusRequest.imageKey);
    window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(
      () => setFocusedKey(null),
      HIGHLIGHT_MS
    );
  }, [focusRequest, images, columns, virtualizer]);

  useEffect(() => () => window.clearTimeout(highlightTimerRef.current), []);

  return (
    <div
      ref={scrollRef}
      data-testid="image-grid"
      className="image-grid absolute inset-0 overflow-y-auto overflow-x-hidden"
    >
      <div
        className="relative mx-auto"
        style={{
          width: contentWidth,
          height: virtualizer.getTotalSize(),
        }}
      >
        {virtualizer.getVirtualItems().map((row) => (
          <div
            key={row.key}
            className="absolute left-0 top-0 w-full"
            style={{
              height: cardHeight,
              transform: `translateY(${row.start}px)`,
            }}
          >
            {images
              .slice(row.index * columns, (row.index + 1) * columns)
              .map((image, column) => (
                <CanvasTile
                  key={image.imageKey}
                  tile={columnTiles[column]}
                  image={image}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(image.imageKey)}
                  highlighted={focusedKey === image.imageKey}
                  onToggleSelect={onToggleSelect}
                  onOpenLightbox={onOpenLightbox}
                  showBookmarkDate
                />
              ))}
          </div>
        ))}
      </div>

      {images.length > 0 && (
        <div
          className="flex justify-center"
          style={{ paddingBottom: BOTTOM_PADDING, paddingTop: GAP }}
        >
          {/* A button rather than scroll-triggered fetching: this is X's private
              API, and a short filtered list would otherwise page through the
              whole library on its own. */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="text-[12.5px] font-medium"
          >
            <History size={14} />
            {loadingOlder ? 'Yükleniyor…' : 'Daha eski kayıtlar'}
          </Button>
        </div>
      )}
    </div>
  );
}
