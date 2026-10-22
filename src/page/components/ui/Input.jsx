import { forwardRef } from 'react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'lg-input--compact',
  subtle: 'lg-input--compact',
};

// Glassy UI's input material, without its label/hint wrapper: every Tappy
// field already supplies its own label or aria-label, and a wrapper div inside
// those labels would break native label association and flex layouts.
export const Input = forwardRef(function Input(
  { variant = 'default', className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={cn(
        'lg-input',
        VARIANTS[variant] ?? VARIANTS.default,
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
