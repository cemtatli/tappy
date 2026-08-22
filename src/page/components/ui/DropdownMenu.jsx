import { Menu } from '@base-ui/react/menu';
import { cn } from '../../lib/cn.js';

export const DropdownMenu = Menu.Root;

export function DropdownMenuTrigger({ className, ...props }) {
  return <Menu.Trigger className={cn('outline-none', className)} {...props} />;
}

export function DropdownMenuContent({ className, children }) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={4}>
        <Menu.Popup
          className={cn(
            'z-50 min-w-44 rounded-[var(--radius)] border border-line bg-white/90 py-1 text-sm text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none backdrop-blur-xl',
            'origin-[var(--transform-origin,center)] transition-[transform,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)]',
            'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
            className
          )}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 px-4 py-2 outline-none data-[highlighted]:bg-black/5',
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="my-1 h-px bg-line" />;
}
