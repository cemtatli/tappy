import { useEffect, useRef } from 'react';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import { clampZoom } from '../lib/canvasZoom.js';
import { Button } from './ui/Button.jsx';

const iconButton = 'size-8 min-w-8 px-0';
const ZOOM_TWEEN_MS = 260;

const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// Step zooms glide to the next level. The canvas keeps the viewport centre
// fixed on every intermediate value, so the glide reads as one smooth dolly.
// Repeated clicks retarget from the level in flight, not from the old target.
function useZoomTween(zoom, onZoomChange) {
  const zoomRef = useRef(zoom);
  const targetRef = useRef(zoom);
  const frameRef = useRef(0);

  useEffect(() => {
    zoomRef.current = zoom;
    if (!frameRef.current) targetRef.current = zoom;
  }, [zoom]);

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  return function zoomBy(factor) {
    const target = clampZoom(targetRef.current * factor);
    targetRef.current = target;
    cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onZoomChange(target);
      return;
    }
    const from = zoomRef.current;
    const startedAt = performance.now();
    function step(now) {
      const t = Math.min(1, (now - startedAt) / ZOOM_TWEEN_MS);
      onZoomChange(from + (target - from) * easeOutCubic(t));
      frameRef.current = t < 1 ? requestAnimationFrame(step) : 0;
    }
    frameRef.current = requestAnimationFrame(step);
  };
}

export function CanvasToolbar({ zoom, onZoomChange, onRecenter }) {
  const percent = Math.round(zoom * 100);
  const zoomBy = useZoomTween(zoom, onZoomChange);
  return (
    <div
      className="glass chrome-in fixed bottom-6 right-6 z-30 flex items-center gap-0.5 rounded-full p-1 px-1.5 text-text max-sm:bottom-24"
      style={{ '--chrome-delay': '140ms' }}
    >
      <Button
        variant="ghost"
        size="sm"
        aria-label="Uzaklaştır"
        className={iconButton}
        onClick={() => zoomBy(1 / 1.25)}
      >
        <Minus size={14} />
      </Button>
      <span
        aria-live="polite"
        className="min-w-11 text-center text-[11.5px] font-medium tabular-nums"
      >
        {percent}%
      </span>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Yakınlaştır"
        className={iconButton}
        onClick={() => zoomBy(1.25)}
      >
        <Plus size={14} />
      </Button>
      <span className="mx-1 h-4 w-px bg-line" />
      <Button
        variant="ghost"
        size="sm"
        aria-label="Başlangıç görünümü"
        title="Başlangıç görünümü"
        className={iconButton}
        onClick={onRecenter}
      >
        <LocateFixed size={14} />
      </Button>
    </div>
  );
}
