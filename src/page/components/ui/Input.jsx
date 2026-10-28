import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'glass h-9 rounded-full px-4 text-sm',
  // Recessed sidebar field: filled, borderless until focused.
  subtle:
    'h-8 rounded-lg border-transparent bg-black/[0.04] px-2.5 text-[13px] tracking-[0.01em]',
};

export const Input = forwardRef(function Input(
  { variant = 'default', className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'tappy-input w-full min-w-0 border text-text placeholder:text-muted',
        VARIANTS[variant] ?? VARIANTS.default,
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
