import { useEffect, useState } from 'react';

// Keeps a closing surface mounted long enough to play its exit animation.
// The first open renders immediately; only the close is deferred.
export function useExitPresence(open, exitMs) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return undefined;
    }
    if (!mounted) return undefined;

    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, mounted, exitMs]);

  return { mounted: mounted || open, closing: !open && mounted };
}
