import { useEffect, useState } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { Button } from './ui/Button.jsx';

// Keep in sync with the w-[420px] classes below: Tailwind cannot read a JS
// constant, so the value has to be written twice.
export const PREVIEW_PANEL_WIDTH = 420;

const EMBED_ORIGIN = 'https://platform.twitter.com';
const INITIAL_EMBED_HEIGHT = 300;

export function PreviewPanel({ tweet, onClose, overlay = false }) {
  const [embedHeight, setEmbedHeight] = useState(INITIAL_EMBED_HEIGHT);

  useEffect(() => {
    setEmbedHeight(INITIAL_EMBED_HEIGHT);
  }, [tweet?.id]);

  // The X embed reports its content height over postMessage; size the iframe to it.
  useEffect(() => {
    function handleMessage(e) {
      if (e.origin !== EMBED_ORIGIN) return;
      const embed = e.data?.['twttr.embed'];
      if (embed?.method !== 'twttr.private.resize') return;
      const height = embed.params?.[0]?.height;
      if (typeof height === 'number' && height > 0) setEmbedHeight(height);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (!tweet) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tweet, onClose]);

  if (overlay && !tweet) return null;

  return (
    <aside
      aria-label="Tweet önizleme"
      className={cn(
        overlay
          ? 'fixed right-0 top-0 z-[60] h-screen w-[420px] overflow-hidden border-l border-line bg-base shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-[panel-in_var(--dur-slow)_var(--ease-out)]'
          : cn(
              'sticky top-0 h-screen shrink-0 overflow-hidden transition-[width] duration-300',
              tweet ? 'w-[420px] border-r border-line' : 'w-0'
            )
      )}
    >
      {tweet && (
        <div className="flex h-full w-[420px] flex-col">
          <div className="flex items-center gap-1 border-b border-line px-4 py-2">
            <h2 className="flex-1 text-[15px] font-bold">Önizleme</h2>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="size-8 min-w-8 px-0 text-muted hover:text-accent"
            >
              <a
                href={tweet.tweetUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X'te aç"
              >
                <ExternalLink size={16} />
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Önizlemeyi kapat"
              onClick={onClose}
              className="size-8 min-w-8 px-0 text-muted hover:text-text"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <iframe
              key={tweet.id}
              title="Tweet önizleme"
              sandbox="allow-scripts allow-same-origin allow-popups"
              src={`https://platform.twitter.com/embed/Tweet.html?id=${tweet.id}&theme=light`}
              style={{ height: `${embedHeight}px` }}
              className="w-full border-0"
            />
          </div>
        </div>
      )}
    </aside>
  );
}
