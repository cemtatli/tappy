import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useExitPresence } from '../lib/usePresence.js';

// Matches --dur-exit in app.css.
const EXIT_MS = 160;

const ROW =
  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-text transition-colors hover:bg-black/[0.035]';

export function AddToCollectionMenu({
  open,
  collections,
  memberOf,
  onToggle,
  onCreate,
  onClose,
}) {
  const { mounted, closing } = useExitPresence(open, EXIT_MS);
  const [name, setName] = useState('');

  if (!mounted) return null;

  function submit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate?.(trimmed);
    setName('');
  }

  return (
    <>
      {/* z-[70] clears the tweet preview panel (z-[60]) as well as the lightbox. */}
      <div className="fixed inset-0 z-[70]" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Koleksiyona ekle"
        style={{ transform: 'translateX(-50%)' }}
        onKeyDown={(e) => {
          if (e.key !== 'Escape') return;
          // Only this menu closes, not the lightbox underneath.
          e.stopPropagation();
          onClose();
        }}
        className={`glass fixed bottom-24 left-1/2 z-[70] w-64 origin-bottom rounded-[20px] bg-white/90 p-1.5 ${
          closing
            ? 'animate-[menu-out_var(--dur-exit)_var(--ease-out)_forwards]'
            : 'animate-[menu-in_var(--dur-base)_var(--ease-out)]'
        }`}
      >
        {collections.length > 0 && (
          <div className="mb-1 max-h-56 space-y-0.5 overflow-y-auto border-b border-black/[0.06] pb-1">
            {collections.map((c) => {
              const checked = memberOf.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => onToggle(c.id, !checked)}
                  className={ROW}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color ?? '#8e8e93' }}
                  />
                  <span className="min-w-0 flex-1 truncate">{c.name}</span>
                  {checked && <Check size={14} className="shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
        <form
          onSubmit={submit}
          className="flex items-center gap-2.5 rounded-lg px-2.5 focus-within:bg-black/[0.035]"
        >
          <Plus size={14} className="shrink-0 text-muted" />
          <input
            // With nothing to pick from, creating is the only thing to do here.
            autoFocus={collections.length === 0}
            aria-label="Yeni koleksiyon adı"
            placeholder="Yeni koleksiyon"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 min-w-0 flex-1 bg-transparent text-[13px] text-text outline-none placeholder:text-muted"
          />
        </form>
      </div>
    </>
  );
}
