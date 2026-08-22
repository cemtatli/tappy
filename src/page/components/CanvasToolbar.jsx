import { ZoomIn } from 'lucide-react';

export function CanvasToolbar({ zoom, onZoomChange }) {
  if (!onZoomChange) return null;
  return (
    <div className="fixed bottom-6 right-6 z-20 flex items-center gap-3 rounded-full border border-line bg-white/70 px-4 py-2 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
      <label className="flex items-center gap-2 text-sm text-muted">
        <ZoomIn size={15} />
        <input
          type="range"
          min="0.2"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => onZoomChange(Number(e.target.value))}
          aria-label="Yakınlaştır"
        />
        <span className="tabular-nums">×{zoom.toFixed(1)}</span>
      </label>
    </div>
  );
}
