import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'h-9 rounded-full border-line bg-white px-4 text-sm',
  // Recessed sidebar field: filled, borderless until focused.
  subtle:
    'h-8 rounded-lg border-transparent bg-black/[0.04] px-2.5 text-[13px] tracking-[0.01em]',
};

export function Input({ variant = 'default', className, ...props }) {
  return (
    <input
      className={cn(
        'border text-text placeholder:text-muted focus:border-accent focus:outline-none',
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}
