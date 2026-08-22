import { cn } from '../../lib/cn.js';

// macOS segmented control: a raised thumb slides along a recessed track. The
// thumb rides on transform so switching never reflows the track.
export function Segmented({ label, value, options, onChange }) {
  const index = Math.max(
    options.findIndex((o) => o.value === value),
    0
  );

  return (
    <div
      role="group"
      aria-label={label}
      className="relative flex h-8 items-center rounded-lg bg-black/[0.05] p-0.5"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0.5 left-0.5 rounded-[7px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.10),0_0_0_0.5px_rgba(0,0,0,0.05)] transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]"
        style={{
          width: `calc((100% - 0.25rem) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
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
              'relative z-10 flex h-7 flex-1 items-center justify-center gap-1.5 rounded-[7px] text-[13px] tracking-[0.01em] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
              active ? 'font-medium text-text' : 'text-muted hover:text-text'
            )}
          >
            <Icon size={13} />
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}
