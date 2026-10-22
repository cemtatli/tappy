import { GlassButton } from '../glassyui/glass-button';
import { cn } from '../../lib/cn.js';

const VARIANTS = {
  default: 'prominent',
  ghost: 'ghost',
  destructive: 'prominent',
  outline: 'primary',
};

const SIZES = {
  default: 'md',
  sm: 'sm',
};

const VARIANT_CLASS = {
  destructive: 'lg-button--destructive',
};

export function Button({
  variant = 'default',
  size = 'default',
  className,
  type = 'button',
  ...props
}) {
  return (
    <GlassButton
      type={type}
      variant={VARIANTS[variant] ?? 'primary'}
      size={SIZES[size] ?? 'md'}
      className={cn(VARIANT_CLASS[variant], className)}
      {...props}
    />
  );
}
