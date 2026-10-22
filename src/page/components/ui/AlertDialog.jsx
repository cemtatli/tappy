import { AlertDialog as BaseAlertDialog } from '@base-ui/react/alert-dialog';
import { Button } from './Button.jsx';
import { cn } from '../../lib/cn.js';

export const AlertDialog = BaseAlertDialog.Root;

export function AlertDialogContent({ className, children }) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className="fixed inset-0 z-40 bg-black/60" />
      <BaseAlertDialog.Popup
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-line bg-white/90 p-6 text-text shadow-[0_8px_30px_rgba(0,0,0,0.12)] outline-none backdrop-blur-xl',
          'transition-[transform,opacity] duration-[var(--dur-base)] ease-[var(--ease-out)]',
          'data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0',
          className
        )}
      >
        {children}
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}

export function AlertDialogTitle({ className, ...props }) {
  return (
    <BaseAlertDialog.Title
      className={cn('text-lg font-bold', className)}
      {...props}
    />
  );
}

export function AlertDialogDescription({ className, ...props }) {
  return (
    <BaseAlertDialog.Description
      className={cn('mt-2 text-sm text-muted', className)}
      {...props}
    />
  );
}

export function AlertDialogClose({ className, variant = 'ghost', ...props }) {
  return (
    <Button variant={variant} size="sm" asChild className={className}>
      <BaseAlertDialog.Close {...props} />
    </Button>
  );
}
