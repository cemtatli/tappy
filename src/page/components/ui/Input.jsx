import { cn } from '../../lib/cn.js';

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'h-9 rounded-full border border-line bg-white px-4 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none',
        className
      )}
      {...props}
    />
  );
}
