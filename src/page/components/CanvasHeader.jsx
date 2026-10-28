import { useState } from 'react';
import {
  CheckSquare,
  ChevronLeft,
  Download,
  Ellipsis,
  Settings,
} from 'lucide-react';
import tappyMark from '../../assets/icons/tappy-mark.svg';
import { Button } from './ui/Button.jsx';
import { cn } from '../lib/cn.js';

function IconButton({ label, active, className, children, ...props }) {
  return (
    <Button
      variant="outline"
      size="sm"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn('size-10 min-w-10 px-0', className)}
      {...props}
    >
      {children}
    </Button>
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
  const [expanded, setExpanded] = useState(false);
  // Selection mode needs its toggle on screen to be finished.
  const open = expanded || selectionMode;

  return (
    <header
      className="chrome-in pointer-events-none fixed inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4"
      style={{ '--chrome-from': '-10px' }}
    >
      <button
        type="button"
        onClick={onHome}
        title="Başlangıç görünümü"
        className="pointer-events-auto flex h-11 items-center gap-2 rounded-full px-0 transition-opacity duration-[var(--dur-fast)] hover:opacity-75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      >
        <img src={tappyMark} alt="" className="h-9 w-9" />
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-text">
          Tappy
        </span>
      </button>

      <div className="pointer-events-auto flex items-center gap-2">
        {open && (
          <div className="header-tray flex items-center gap-2">
            <span
              role="status"
              aria-live="polite"
              className="glass hidden h-10 items-center gap-2 rounded-full px-4 text-[12px] font-medium text-text sm:flex"
            >
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
        )}
        {!open && (
          <span role="status" aria-live="polite" className="sr-only">
            {count} görsel · {sourceLabel}
          </span>
        )}
        {!selectionMode && (
          <Button
            variant="outline"
            size="sm"
            aria-label={expanded ? 'Menüyü kapat' : 'Menüyü aç'}
            aria-expanded={expanded}
            title={expanded ? 'Menüyü kapat' : 'Menüyü aç'}
            onClick={() => setExpanded((value) => !value)}
            className="size-10 min-w-10 px-0"
          >
            <span
              className="flex transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            >
              {expanded ? <ChevronLeft size={17} /> : <Ellipsis size={17} />}
            </span>
          </Button>
        )}
      </div>
    </header>
  );
}
