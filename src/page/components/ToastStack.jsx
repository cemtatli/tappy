import { Check, X, Info } from 'lucide-react';
import { Button } from './ui/Button.jsx';

// Colour lives on the icon only: text stays high-contrast on the translucent surface.
const TYPE_ICON = {
  success: { icon: Check, iconClass: 'text-emerald-600' },
  error: { icon: X, iconClass: 'text-rose-600' },
  info: { icon: Info, iconClass: 'text-sky-600' },
};

const SURFACE =
  'toast-surface pointer-events-auto h-auto max-w-xs justify-start gap-2.5 rounded-2xl px-4 py-2.5 text-left animate-[toast-in_var(--dur-base)_var(--ease-out)]';

function ToastBody({ icon: Icon, iconClass, message }) {
  return (
    <>
      <Icon size={16} className={`shrink-0 ${iconClass}`} />
      <span className="text-[13px] font-medium leading-snug tracking-[-0.01em] text-text">
        {message}
      </span>
    </>
  );
}

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts?.length) return null;
  return (
    // z-[100] clears the lightbox (z-50) and tweet preview (z-[60]).
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col items-end gap-2">
      {toasts.map((t) => {
        const { icon, iconClass } = TYPE_ICON[t.type] ?? TYPE_ICON.info;
        // A toast with an action cannot itself be a button: buttons do not nest,
        // and a stray click on it must not read as a dismissal of the undo.
        if (t.action) {
          return (
            <div
              key={t.id}
              role="status"
              className={`glass flex items-center ${SURFACE}`}
            >
              <ToastBody
                icon={icon}
                iconClass={iconClass}
                message={t.message}
              />
              <button
                type="button"
                onClick={t.action.onClick}
                className="press ml-1 shrink-0 rounded-full bg-black/[0.06] px-2.5 py-1 text-[12.5px] font-semibold text-text hover:bg-black/[0.1]"
              >
                {t.action.label}
              </button>
            </div>
          );
        }
        return (
          <Button
            key={t.id}
            variant="outline"
            size="sm"
            onClick={() => onDismiss(t.id)}
            className={SURFACE}
          >
            <ToastBody icon={icon} iconClass={iconClass} message={t.message} />
          </Button>
        );
      })}
    </div>
  );
}
