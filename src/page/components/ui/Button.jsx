import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'bg-accent text-white hover:bg-accent/90',
  ghost: 'text-text hover:bg-black/5',
  destructive: 'bg-danger text-white hover:bg-danger/90',
  outline: 'border border-line bg-white text-text hover:bg-black/5',
};

const SIZES = {
  default: 'h-9 px-4 text-sm',
  sm: 'h-8 px-3 text-sm',
};

export function Button({
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-bold transition-[transform,background-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)] active:scale-[0.98] disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    />
  );
}
