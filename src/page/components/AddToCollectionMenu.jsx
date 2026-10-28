import { Check } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { useExitPresence } from '../lib/usePresence.js';

// Matches --dur-exit in app.css.
const EXIT_MS = 160;

export function AddToCollectionMenu({
  open,
  collections,
  memberOf,
  onToggle,
  onClose,
}) {
  const { mounted, closing } = useExitPresence(open, EXIT_MS);

  if (!mounted) return null;
  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        style={{ transform: 'translateX(-50%)' }}
        className={`fixed bottom-24 left-1/2 z-[60] w-56 rounded-xl border border-line bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] origin-bottom ${
          closing
            ? 'animate-[menu-out_var(--dur-exit)_var(--ease-out)_forwards]'
            : 'animate-[menu-in_var(--dur-base)_var(--ease-out)]'
        }`}
      >
        <p className="px-2 py-1 text-xs uppercase text-muted">
          Koleksiyona ekle
        </p>
        {collections.length === 0 && (
          <p className="px-2 py-2 text-sm text-muted">Henüz koleksiyon yok.</p>
        )}
        {collections.map((c) => {
          const checked = memberOf.has(c.id);
          return (
            <Button
              key={c.id}
              variant="ghost"
              size="sm"
              onClick={() => onToggle(c.id, !checked)}
              className="w-full justify-start rounded-lg px-2 py-1.5 text-left text-sm"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {checked && <Check size={14} />}
              </span>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
            </Button>
          );
        })}
      </div>
    </>
  );
}
