import { cn } from '../../lib/cn.js';

// macOS segmented control: a raised thumb slides along a recessed track. The
// thumb rides on transform so switching never reflows the track.
// With no matching value (e.g. a collection is the active source) the thumb
// fades out instead of pretending the first option is selected.
export function Segmented({ label, value, options, onChange, className }) {
  const found = options.findIndex((o) => o.value === value);
  const index = Math.max(found, 0);

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'relative flex h-9 items-center rounded-full bg-black/[0.045] p-[3px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]',
        className
      )}
    >
      <span
        aria-hidden="true"
        className="glass-thumb absolute inset-y-[3px] left-[3px] rounded-full transition-[transform,opacity] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
        style={{
          width: `calc((100% - 6px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
          opacity: found === -1 ? 0 : 1,
        }}
      />
      {options.map(({ value: optionValue, label: optionLabel, Icon }) => {
        const active = optionValue === value;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={String(active)}
            onClick={() => onChange(optionValue)}
            className={cn(
              'relative z-10 flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] tracking-[0.01em] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
              active ? 'font-medium text-text' : 'text-muted hover:text-text'
            )}
          >
            {Icon && <Icon size={13} />}
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
