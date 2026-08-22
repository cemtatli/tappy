import { Check, X, Info } from 'lucide-react';

// Colour lives on the icon only: text stays high-contrast on the translucent surface.
const TYPE_ICON = {
  success: { icon: Check, iconClass: 'text-emerald-600' },
  error: { icon: X, iconClass: 'text-rose-600' },
  info: { icon: Info, iconClass: 'text-sky-600' },
};

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    // z-[100] clears the lightbox (z-50) and tweet preview (z-[60]).
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col items-end gap-2">
      {toasts.map((t) => {
        const { icon: Icon, iconClass } = TYPE_ICON[t.type] ?? TYPE_ICON.info;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onDismiss(t.id)}
            className="toast-surface pointer-events-auto flex max-w-xs items-center gap-2.5 rounded-2xl border border-white/60 bg-white/75 px-4 py-2.5 text-left shadow-[0_10px_40px_-4px_rgba(0,0,0,0.25)] backdrop-blur-xl backdrop-saturate-150 motion-safe:animate-[toast-in_var(--dur-base)_var(--ease-out)]"
          >
            <Icon size={16} className={`shrink-0 ${iconClass}`} />
            <span className="text-[13px] font-medium leading-snug tracking-[-0.01em] text-text">
              {t.message}
            </span>
          </button>
        );
      })}
    </div>
  );
}
