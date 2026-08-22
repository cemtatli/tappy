import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Checkbox({ className, ...props }) {
  return (
    <BaseCheckbox.Root
      className={cn(
        'flex size-5 shrink-0 items-center justify-center rounded border border-line bg-transparent data-[checked]:border-accent data-[checked]:bg-accent',
        className
      )}
      {...props}
    >
      <BaseCheckbox.Indicator className="text-white">
        <Check size={14} strokeWidth={3} />
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
