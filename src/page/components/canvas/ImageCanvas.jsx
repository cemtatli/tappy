import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { layoutMasonry, visibleTiles } from '../../lib/canvasLayout.js';
import { clampPan, panBounds, rubberBand } from '../../lib/canvasPan.js';
import { reanchorPan } from '../../lib/canvasZoom.js';
import { CanvasTile } from './CanvasTile.jsx';

const COLUMN_WIDTH = 220;
const GAP = 16;
const ZOOM_MIN = 0.2;
const ZOOM_MAX = 3;
const RUBBER_RESISTANCE = 0.3;
const MOMENTUM_DECAY = 0.94;
const SPRING_LERP = 0.18;
const SPRING_STOP = 0.5;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ImageCanvas({
  images,
  zoom,
  onZoomChange,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpenLightbox,
}) {
  const viewportRef = useRef(null);
  const [size, setSize] = useState({ width: 1000, height: 800 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [ratios, setRatios] = useState(() => new Map());
  const [dragging, setDragging] = useState(false);

  const pendingPanRef = useRef(null);
  const rafRef = useRef(0);

  function schedulePan(next) {
    pendingPanRef.current = next;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (pendingPanRef.current) {
        setPan(pendingPanRef.current);
        panRef.current = pendingPanRef.current;
      }
    });
  }

  const pendingRatiosRef = useRef(new Map());
  const ratioFlushRef = useRef(0);

  const onImgLoad = useCallback((e, imageKey) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (!naturalWidth) return;
    pendingRatiosRef.current.set(imageKey, naturalHeight / naturalWidth);
    if (ratioFlushRef.current) return;
    ratioFlushRef.current = requestAnimationFrame(() => {
      ratioFlushRef.current = 0;
      setRatios((prev) => {
        const next = new Map(prev);
        for (const [k, v] of pendingRatiosRef.current) next.set(k, v);
        pendingRatiosRef.current.clear();
        return next;
      });
    });
  }, []);

  const dragRef = useRef(null);
  const momentumRef = useRef(0);
  const springRef = useRef(0);
  const velRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef(null);
  // Keep latest pan/zoom/bounds accessible inside rAF closures without stale captures
  const panRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(zoom);
  const boundsRef = useRef(null);
  // Previous world height, needed to reanchor after a reflow.
  const prevWorldHeightRef = useRef(null);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () =>
      setSize({
        width: el.clientWidth || 1000,
        height: el.clientHeight || 800,
      });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const imagesByKey = useMemo(
    () => new Map(images.map((i) => [i.imageKey, i])),
    [images]
  );

  // Zoom is a layout parameter, not a transform: the column width scales, the
  // viewport does not, so the column count drops and the masonry reflows gapless.
  const layout = useMemo(
    () =>
      layoutMasonry(images, {
        columnWidth: COLUMN_WIDTH * zoom,
        gap: GAP,
        containerWidth: size.width,
        ratios,
      }),
    [images, size.width, ratios, zoom]
  );

  // The world is already at real size in reflow mode, so pass zoom: 1.
  const bounds = useMemo(
    () =>
      panBounds({
        worldWidth: layout.worldWidth,
        worldHeight: layout.worldHeight,
        viewportWidth: size.width,
        viewportHeight: size.height,
        zoom: 1,
        margin: 48,
      }),
    [layout.worldWidth, layout.worldHeight, size.width, size.height]
  );

  useEffect(() => {
    boundsRef.current = bounds;
  }, [bounds]);

  // Zoom changes the column count and therefore the world height; recompute pan.y
  // so the visible vertical centre stays put.
  useEffect(() => {
    const newWorldH = layout.worldHeight;
    const oldWorldH = prevWorldHeightRef.current;
    prevWorldHeightRef.current = newWorldH;
    if (oldWorldH == null || oldWorldH === newWorldH) return;
    const nextY = reanchorPan(
      panRef.current.y,
      size.height,
      oldWorldH,
      newWorldH
    );
    const clamped = clampPan({ x: panRef.current.x, y: nextY }, bounds);
    panRef.current = clamped;
    setPan(clamped);
    // Reanchor on zoom only; bounds/size are read fresh from the closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // World is 1:1 in reflow mode, so screen and world coordinates match.
  const overscan = COLUMN_WIDTH; // world-coordinate overscan
  const viewportWorld = {
    x: -pan.x - overscan,
    y: -pan.y - overscan,
    width: size.width + overscan * 2,
    height: size.height + overscan * 2,
  };
  const shown = useMemo(
    () => visibleTiles(layout.tiles, viewportWorld),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [layout, pan.x, pan.y, size.width, size.height]
  );

  function cancelMomentum() {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = 0;
    }
  }
  function cancelSpring() {
    if (springRef.current) {
      cancelAnimationFrame(springRef.current);
      springRef.current = 0;
    }
  }

  function startSpringBack(fromPan) {
    cancelSpring();
    cancelMomentum();
    if (prefersReducedMotion()) {
      const clamped = clampPan(fromPan, boundsRef.current);
      setPan(clamped);
      panRef.current = clamped;
      return;
    }
    function step() {
      const b = boundsRef.current;
      const cur = panRef.current;
      const target = clampPan(cur, b);
      const dx = target.x - cur.x;
      const dy = target.y - cur.y;
      if (Math.abs(dx) < SPRING_STOP && Math.abs(dy) < SPRING_STOP) {
        setPan(target);
        panRef.current = target;
        springRef.current = 0;
        return;
      }
      const next = { x: cur.x + dx * SPRING_LERP, y: cur.y + dy * SPRING_LERP };
      setPan(next);
      panRef.current = next;
      springRef.current = requestAnimationFrame(step);
    }
    springRef.current = requestAnimationFrame(step);
  }

  function startMomentum(initVel) {
    cancelMomentum();
    cancelSpring();
    let vx = initVel.x;
    let vy = initVel.y;
    function step() {
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        momentumRef.current = 0;
        startSpringBack(panRef.current);
        return;
      }
      const b = boundsRef.current;
      const cur = panRef.current;
      const raw = { x: cur.x + vx, y: cur.y + vy };
      const clamped = clampPan(raw, b);
      // At edges, kill velocity on that axis
      if (raw.x !== clamped.x) vx = 0;
      if (raw.y !== clamped.y) vy = 0;
      vx *= MOMENTUM_DECAY;
      vy *= MOMENTUM_DECAY;
      setPan(clamped);
      panRef.current = clamped;
      momentumRef.current = requestAnimationFrame(step);
    }
    momentumRef.current = requestAnimationFrame(step);
  }

  const DRAG_THRESHOLD = 5;

  function onPointerDown(e) {
    cancelMomentum();
    cancelSpring();
    // Defer pointer capture until the pointer passes DRAG_THRESHOLD, so a plain
    // click still reaches the tile's onClick and opens the lightbox.
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: panRef.current.x,
      py: panRef.current.y,
      active: false,
    };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velRef.current = { x: 0, y: 0 };
  }

  function onPointerMove(e) {
    if (!dragRef.current) return;
    const d = dragRef.current;

    if (!d.active) {
      const dist = Math.hypot(e.clientX - d.sx, e.clientY - d.sy);
      if (dist < DRAG_THRESHOLD) return;
      d.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const b = boundsRef.current;
    const rawX = d.px + (e.clientX - d.sx);
    const rawY = d.py + (e.clientY - d.sy);
    const rbX = rubberBand(rawX, b.minX, b.maxX, RUBBER_RESISTANCE);
    const rbY = rubberBand(rawY, b.minY, b.maxY, RUBBER_RESISTANCE);
    const now = performance.now();
    const last = lastMoveRef.current;
    if (last) {
      const dt = now - last.t || 1;
      velRef.current = {
        x: ((e.clientX - last.x) / dt) * 16, // ~16ms frame budget
        y: ((e.clientY - last.y) / dt) * 16,
      };
    }
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };
    schedulePan({ x: rbX, y: rbY });
  }

  function onPointerUp(e) {
    if (!dragRef.current) return;
    const wasDrag = dragRef.current.active;
    dragRef.current = null;
    setDragging(false);

    if (wasDrag) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {
        // ignore
      }
      const vel = velRef.current;
      const speed = Math.hypot(vel.x, vel.y);
      if (speed > 1.5) {
        startMomentum(vel);
      } else {
        startSpringBack(panRef.current);
      }
    }
  }

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e) {
      e.preventDefault();
      const b = boundsRef.current;
      if (e.ctrlKey) {
        // Trackpad pinch: only set the zoom — the zoom effect reanchors pan.y.
        const curZoom = zoomRef.current;
        const factor = e.deltaY < 0 ? 1.05 : 0.95;
        const nextZoom = Math.min(
          ZOOM_MAX,
          Math.max(ZOOM_MIN, curZoom * factor)
        );
        onZoomChange(nextZoom);
      } else {
        // Two-finger scroll or mouse wheel → pan (hard clamp, no rubber-band)
        const cur = panRef.current;
        const rawPan = { x: cur.x - e.deltaX, y: cur.y - e.deltaY };
        const clamped = clampPan(rawPan, b);
        schedulePan(clamped);
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onZoomChange]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(ratioFlushRef.current);
      cancelMomentum();
      cancelSpring();
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="relative h-screen flex-1 overflow-hidden bg-surface-2"
      style={{
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0)`,
          willChange: 'transform',
        }}
      >
        {shown.map((tile) => (
          <CanvasTileWrapper
            key={tile.imageKey}
            tile={tile}
            image={imagesByKey.get(tile.imageKey)}
            selectionMode={selectionMode}
            selected={selectedIds.has(tile.imageKey)}
            onToggleSelect={onToggleSelect}
            onOpenLightbox={onOpenLightbox}
            onImgLoad={onImgLoad}
          />
        ))}
      </div>
    </div>
  );
}

// Memoized so tiles don't re-render on pan/zoom — all props are primitives or
// stable refs (useCallback handlers + stable image/tile objects).
const CanvasTileWrapper = memo(function CanvasTileWrapper({
  onImgLoad,
  image,
  ...rest
}) {
  // Wrapped so the aspect-ratio measurement does not change CanvasTile's signature.
  return (
    <div
      onLoadCapture={(e) =>
        e.target.tagName === 'IMG' && onImgLoad(e, image.imageKey)
      }
    >
      <CanvasTile image={image} {...rest} />
    </div>
  );
});
