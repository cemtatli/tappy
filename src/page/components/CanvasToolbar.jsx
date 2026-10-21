import { LocateFixed, Minus, Plus } from 'lucide-react';
import { clampZoom } from '../lib/canvasZoom.js';

const button =
  'flex h-8 w-8 items-center justify-center rounded-full text-text transition-colors duration-[var(--dur-fast)] hover:bg-black/5';

export function CanvasToolbar({ zoom, onZoomChange, onRecenter }) {
  const percent = Math.round(zoom * 100);
  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-0.5 rounded-full border border-line/80 bg-white/80 p-1 pl-1.5 pr-1.5 text-text shadow-[0_1px_2px_rgba(28,27,24,0.04),0_14px_40px_-20px_rgba(28,27,24,0.4)] backdrop-blur-xl max-sm:bottom-24">
      <button
        type="button"
        aria-label="Uzaklaştır"
        className={button}
        onClick={() => onZoomChange(clampZoom(zoom / 1.25))}
      >
        <Minus size={14} />
      </button>
      <span
        aria-live="polite"
        className="min-w-11 text-center text-[11.5px] font-medium tabular-nums"
      >
        {percent}%
      </span>
      <button
        type="button"
        aria-label="Yakınlaştır"
        className={button}
        onClick={() => onZoomChange(clampZoom(zoom * 1.25))}
      >
        <Plus size={14} />
      </button>
      <span className="mx-1 h-4 w-px bg-line" />
      <button
        type="button"
        aria-label="Başlangıç görünümü"
        title="Başlangıç görünümü"
        className={button}
        onClick={onRecenter}
      >
        <LocateFixed size={14} />
      </button>
    </div>
  );
}
