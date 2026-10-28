import { Children, cloneElement, isValidElement } from 'react';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'button-primary text-white hover:brightness-105',
  ghost: 'text-text hover:bg-black/[0.05]',
  destructive: 'button-danger text-white hover:brightness-105',
  // Frosted pill; as a pressed toggle it becomes the raised thumb (app.css).
  outline: 'glass text-text',
};

// Size classes live in a CSS layer below Tailwind utilities (app.css), so a
// caller's `size-8 px-0` always wins without a class-merging helper.
const SIZES = {
  default: 'button-md',
  sm: 'button-sm',
};

export function Button({
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  asChild = false,
  children,
  ...props
}) {
  const classes = cn(
    'press inline-flex items-center justify-center gap-2 rounded-full font-semibold disabled:opacity-50 [&_svg]:shrink-0',
    VARIANTS[variant],
    SIZES[size],
    className
  );

  // Render the single child (a link, a dialog close) as the button itself
  // instead of nesting it inside a <button>.
  if (asChild) {
    const child = Children.only(children);
    if (isValidElement(child)) {
      return cloneElement(child, {
        ...props,
        ...child.props,
        className: cn(classes, child.props.className),
      });
    }
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
