import { LocateFixed, Minus, Plus } from 'lucide-react';
import { clampZoom } from '../lib/canvasZoom.js';
import { Button } from './ui/Button.jsx';

const iconButton = 'size-8 min-w-8 px-0';

export function CanvasToolbar({ zoom, onZoomChange, onRecenter }) {
  const percent = Math.round(zoom * 100);
  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-0.5 rounded-full border border-line/80 bg-white/80 p-1 pl-1.5 pr-1.5 text-text shadow-[0_1px_2px_rgba(28,27,24,0.04),0_14px_40px_-20px_rgba(28,27,24,0.4)] backdrop-blur-xl max-sm:bottom-24">
      <Button
        variant="ghost"
        size="sm"
        aria-label="Uzaklaştır"
        className={iconButton}
        onClick={() => onZoomChange(clampZoom(zoom / 1.25))}
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
        onClick={() => onZoomChange(clampZoom(zoom * 1.25))}
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
