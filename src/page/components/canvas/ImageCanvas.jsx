import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createTileIndex,
  layoutScatter,
  visibleCopies,
  visibleTilesFromIndex,
} from '../../lib/canvasLayout.js';
import { clampZoom } from '../../lib/canvasZoom.js';
import { CanvasTile } from './CanvasTile.jsx';

const DRAG_THRESHOLD = 5;
const MOMENTUM_DECAY = 0.92;
// Mount a little beyond the viewport so momentum never exposes empty space,
// expressed in screen pixels so the margin feels the same at every zoom.
const OVERSCAN_PX = 360;
const HIGHLIGHT_MS = 3200;
// Small sets stay a single finite world; tiling them would put the same few
// cards on screen several times at once.
const WRAP_MIN_TILES = 50;
// Below this zoom cards switch to a light rendering: small image, no caption,
// no shadow. Hundreds of full cards on screen is what makes far zoom stutter.
const COMPACT_ZOOM = 0.5;
// Pan/zoom marks the world as moving until input settles for this long.
const SETTLE_MS = 140;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

// The scatter layout is centred on the origin: the newest row straddles it and
// later rows alternate above/below while every row is centred horizontally.
function homePan(size) {
  return { x: size.width / 2, y: size.height / 2 };
}

function tilePan(tile, size, zoom) {
  return {
    x: size.width / 2 - (tile.x + tile.w / 2) * zoom,
    y: size.height / 2 - (tile.y + tile.h / 2) * zoom,
  };
}

// On a tiled world every target exists once per copy. Pick the copy closest to
// the current pan so flights stay short no matter how far the user wandered.
function nearestCopyPan(target, from, layout, zoom, wrap) {
  if (!wrap) return target;
  const stepX = layout.periodX * zoom;
  const stepY = layout.periodY * zoom;
  return {
    x: target.x + Math.round((from.x - target.x) / stepX) * stepX,
    y: target.y + Math.round((from.y - target.y) / stepY) * stepY,
  };
}

export function ImageCanvas({
  images,
  zoom,
  onZoomChange,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpenLightbox,
  focusRequest,
  viewKey,
}) {
  const viewportRef = useRef(null);
  const [size, setSize] = useState(() => ({
    width: typeof window === 'undefined' ? 1000 : window.innerWidth || 1000,
    height: typeof window === 'undefined' ? 800 : window.innerHeight || 800,
  }));
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [focusedKey, setFocusedKey] = useState(null);
  const [moving, setMoving] = useState(false);
  const settleTimerRef = useRef(0);
  const compact = zoom < COMPACT_ZOOM;

  // rAF batched pan: drag and momentum can fire faster than React renders.
  const pendingPanRef = useRef(null);
  const rafRef = useRef(0);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  const dragRef = useRef(null);
  const momentumRef = useRef(0);
  const tweenRef = useRef(0);
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastMoveRef = useRef(null);
  const highlightTimerRef = useRef(0);
  const focusHandledRef = useRef(null);
  const didInitRef = useRef(false);
  const prevViewKeyRef = useRef(viewKey);
  const prevZoomRef = useRef(zoom);
  const zoomAnchorRef = useRef(null);
  const skipAnchorRef = useRef(false);
  const suppressClickRef = useRef(false);

  function commitPan(next) {
    panRef.current = next;
    setPan(next);
  }

  // While the world moves, hover and hit-testing are switched off (app.css),
  // so the browser only composites the transform.
  function markMoving() {
    setMoving(true);
    window.clearTimeout(settleTimerRef.current);
    settleTimerRef.current = window.setTimeout(
      () => setMoving(false),
      SETTLE_MS
    );
  }

  function schedulePan(next) {
    markMoving();
    pendingPanRef.current = next;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (pendingPanRef.current) commitPan(pendingPanRef.current);
    });
  }

  function cancelMomentum() {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = 0;
    }
  }

  function cancelTween() {
    if (tweenRef.current) {
      cancelAnimationFrame(tweenRef.current);
      tweenRef.current = 0;
    }
  }

  function animatePanTo(target, duration = 620) {
    cancelTween();
    cancelMomentum();
    if (prefersReducedMotion()) {
      commitPan(target);
      return;
    }
    const from = { ...panRef.current };
    const startedAt = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = easeInOutCubic(t);
      commitPan({
        x: from.x + (target.x - from.x) * eased,
        y: from.y + (target.y - from.y) * eased,
      });
      if (t < 1) {
        tweenRef.current = requestAnimationFrame(step);
      } else {
        tweenRef.current = 0;
      }
    }
    tweenRef.current = requestAnimationFrame(step);
  }

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
        width: el.clientWidth || window.innerWidth || 1000,
        height: el.clientHeight || window.innerHeight || 800,
      });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo(() => layoutScatter(images), [images]);
  const wrap = layout.tiles.length >= WRAP_MIN_TILES;
  const imagesByKey = useMemo(
    () => new Map(images.map((image) => [image.imageKey, image])),
    [images]
  );

  // Landing position. Runs once, and again whenever the query itself changes —
  // filtering reflows the world, so staying deep in the old layout would show
  // blank space.
  useLayoutEffect(() => {
    if (didInitRef.current) return;
    if (!layout.tiles.length || size.width < 2) return;
    didInitRef.current = true;
    commitPan(homePan(size));
  }, [layout, size]);

  useEffect(() => {
    if (prevViewKeyRef.current === viewKey) return;
    prevViewKeyRef.current = viewKey;
    cancelMomentum();
    cancelTween();
    setFocusedKey(null);
    if (layout.tiles.length > 0) {
      commitPan(homePan(size));
    }
  }, [viewKey, layout, size]);

  // Zoom is a world transform. Keep the world point under the pointer (or the
  // viewport centre for toolbar zooms) fixed while the scale changes.
  useLayoutEffect(() => {
    const prev = prevZoomRef.current;
    prevZoomRef.current = zoom;
    if (prev === zoom) return;
    if (skipAnchorRef.current) {
      skipAnchorRef.current = false;
      return;
    }
    const anchor = zoomAnchorRef.current ?? {
      x: size.width / 2,
      y: size.height / 2,
    };
    zoomAnchorRef.current = null;
    const worldX = (anchor.x - panRef.current.x) / prev;
    const worldY = (anchor.y - panRef.current.y) / prev;
    commitPan({
      x: anchor.x - worldX * zoom,
      y: anchor.y - worldY * zoom,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  useEffect(() => {
    if (!focusRequest) return;
    if (focusHandledRef.current === focusRequest.nonce) return;
    if (!layout.tiles.length || size.width < 2) return;
    focusHandledRef.current = focusRequest.nonce;

    if (focusRequest.type === 'home') {
      setFocusedKey(null);
      cancelMomentum();
      cancelTween();
      const targetZoom = 1;
      if (Math.abs(zoom - targetZoom) > 0.001) {
        skipAnchorRef.current = true;
        onZoomChange(targetZoom);
      }
      animatePanTo(
        nearestCopyPan(homePan(size), panRef.current, layout, targetZoom, wrap),
        680
      );
      return;
    }

    const tile = layout.tiles.find(
      (item) => item.imageKey === focusRequest.imageKey
    );
    if (!tile) return;

    cancelMomentum();
    cancelTween();
    const targetZoom = Math.min(1.4, Math.max(zoom, 0.92));
    if (Math.abs(zoom - targetZoom) > 0.001) {
      skipAnchorRef.current = true;
      onZoomChange(targetZoom);
    }
    animatePanTo(
      nearestCopyPan(
        tilePan(tile, size, targetZoom),
        panRef.current,
        layout,
        targetZoom,
        wrap
      ),
      700
    );
    setFocusedKey(tile.imageKey);
    window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(
      () => setFocusedKey(null),
      HIGHLIGHT_MS
    );
    // animatePanTo is recreated per render on purpose; the nonce guard above
    // ensures this effect only reacts to a new request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest, layout, size, zoom, onZoomChange, wrap]);

  const tileIndex = useMemo(() => createTileIndex(layout.tiles), [layout]);
  const copies = useMemo(() => {
    const inverseZoom = 1 / zoom;
    const overscan = OVERSCAN_PX * inverseZoom;
    const viewport = {
      x: -pan.x * inverseZoom - overscan,
      y: -pan.y * inverseZoom - overscan,
      width: size.width * inverseZoom + overscan * 2,
      height: size.height * inverseZoom + overscan * 2,
    };
    if (wrap) return visibleCopies(tileIndex, viewport, layout);
    const tiles = visibleTilesFromIndex(tileIndex, viewport);
    return tiles.length ? [{ key: '0:0', dx: 0, dy: 0, tiles }] : [];
  }, [tileIndex, layout, wrap, pan.x, pan.y, size.width, size.height, zoom]);

  function startMomentum(initialVelocity) {
    cancelMomentum();
    cancelTween();
    let vx = initialVelocity.x;
    let vy = initialVelocity.y;
    function step() {
      markMoving();
      if (Math.abs(vx) < 0.08 && Math.abs(vy) < 0.08) {
        momentumRef.current = 0;
        return;
      }
      vx *= MOMENTUM_DECAY;
      vy *= MOMENTUM_DECAY;
      commitPan({
        x: panRef.current.x + vx,
        y: panRef.current.y + vy,
      });
      momentumRef.current = requestAnimationFrame(step);
    }
    momentumRef.current = requestAnimationFrame(step);
  }

  function onPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    cancelMomentum();
    cancelTween();
    dragRef.current = {
      sx: e.clientX,
      sy: e.clientY,
      px: panRef.current.x,
      py: panRef.current.y,
      active: false,
    };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    velocityRef.current = { x: 0, y: 0 };
  }

  function onPointerMove(e) {
    const drag = dragRef.current;
    if (!drag) return;

    if (!drag.active) {
      const distance = Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy);
      if (distance < DRAG_THRESHOLD) return;
      drag.active = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    const now = performance.now();
    const last = lastMoveRef.current;
    if (last) {
      const dt = now - last.t || 1;
      velocityRef.current = {
        x: ((e.clientX - last.x) / dt) * 16,
        y: ((e.clientY - last.y) / dt) * 16,
      };
    }
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };
    schedulePan({
      x: drag.px + (e.clientX - drag.sx),
      y: drag.py + (e.clientY - drag.sy),
    });
  }

  function onPointerUp(e) {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setDragging(false);

    if (drag.active) {
      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Capture may already be gone.
      }
      const velocity = velocityRef.current;
      if (Math.hypot(velocity.x, velocity.y) > 1.5) {
        startMomentum(velocity);
      }
    }
  }

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e) {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        markMoving();
        const rect = el.getBoundingClientRect();
        zoomAnchorRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
        onZoomChange(clampZoom(zoomRef.current * Math.exp(-e.deltaY * 0.0022)));
      } else {
        schedulePan({
          x: panRef.current.x - e.deltaX,
          y: panRef.current.y - e.deltaY,
        });
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
    // schedulePan only touches refs and stable state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onZoomChange]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelMomentum();
      cancelTween();
      window.clearTimeout(highlightTimerRef.current);
      window.clearTimeout(settleTimerRef.current);
    };
  }, []);

  function handleDoubleClick(e) {
    if (e.target.closest?.('[data-canvas-card]')) return;
    const rect = viewportRef.current.getBoundingClientRect();
    zoomAnchorRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    onZoomChange(clampZoom(zoomRef.current * 1.35));
  }

  return (
    <div
      ref={viewportRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={handleDoubleClick}
      onClickCapture={(e) => {
        if (!suppressClickRef.current) return;
        suppressClickRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
      className="canvas-surface absolute inset-0 overflow-hidden"
      style={{
        touchAction: 'none',
        cursor: dragging ? 'grabbing' : 'grab',
      }}
    >
      <div
        className="canvas-world absolute left-0 top-0 origin-top-left"
        data-compact={compact ? 'true' : undefined}
        data-moving={moving ? 'true' : undefined}
        style={{
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        {copies.map((copy) => (
          <div
            key={copy.key}
            className="absolute left-0 top-0"
            style={{ transform: `translate(${copy.dx}px, ${copy.dy}px)` }}
          >
            {copy.tiles.map((tile) => (
              <CanvasTileWrapper
                key={tile.imageKey}
                tile={tile}
                image={imagesByKey.get(tile.imageKey)}
                selectionMode={selectionMode}
                selected={selectedIds.has(tile.imageKey)}
                highlighted={focusedKey === tile.imageKey}
                onToggleSelect={onToggleSelect}
                onOpenLightbox={onOpenLightbox}
                compact={compact}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Memoized so tiles don't re-render on pan/zoom — every prop is a primitive or
// a stable handler/image/tile reference.
const CanvasTileWrapper = memo(function CanvasTileWrapper({ image, ...rest }) {
  return <CanvasTile image={image} {...rest} />;
});
