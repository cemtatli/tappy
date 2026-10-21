import { CheckSquare, Download, Settings } from 'lucide-react';
import tappyMark from '../../assets/icons/tappy-mark.svg';
import { cn } from '../lib/cn.js';

function IconButton({ label, active, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border shadow-[0_1px_2px_rgba(28,27,24,0.04),0_10px_30px_-18px_rgba(28,27,24,0.35)] backdrop-blur-xl transition-[background-color,color,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-95',
        active
          ? 'border-text bg-text text-white hover:bg-black'
          : 'border-line/80 bg-white/80 text-text hover:bg-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function CanvasHeader({
  count,
  sourceLabel,
  selectionMode,
  onToggleSelectionMode,
  onExportAll,
  onOpenSettings,
  onHome,
}) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4">
      <button
        type="button"
        onClick={onHome}
        title="Başlangıç görünümü"
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full border border-line/80 bg-white/80 py-1 pl-1 pr-4 shadow-[0_1px_2px_rgba(28,27,24,0.04),0_10px_30px_-18px_rgba(28,27,24,0.35)] backdrop-blur-xl transition-colors hover:bg-white"
      >
        <img src={tappyMark} alt="" className="h-9 w-9 rounded-[10px]" />
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-text">
          Tappy
        </span>
      </button>

      <div className="pointer-events-auto flex items-center gap-2">
        <span
          role="status"
          aria-live="polite"
          className="hidden h-10 items-center gap-2 rounded-full border border-line/80 bg-white/80 px-4 text-[12px] font-medium text-text shadow-[0_1px_2px_rgba(28,27,24,0.04),0_10px_30px_-18px_rgba(28,27,24,0.35)] backdrop-blur-xl sm:flex"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="tabular-nums">{count} görsel</span>
          <span className="text-muted">· {sourceLabel}</span>
        </span>
        <IconButton
          label={selectionMode ? 'Seçimi bitir' : 'Seç'}
          active={selectionMode}
          onClick={onToggleSelectionMode}
        >
          <CheckSquare size={17} />
        </IconButton>
        <IconButton label="Tümünü JSON olarak indir" onClick={onExportAll}>
          <Download size={17} />
        </IconButton>
        <IconButton label="Ayarlar" onClick={onOpenSettings}>
          <Settings size={17} />
        </IconButton>
      </div>
    </header>
  );
}
