import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { bookmarkedAt } from '../../shared/tweetModel.js';
import { cn } from '../lib/cn.js';
import { formatDayTime } from '../lib/formatDate.js';
import { Button } from './ui/Button.jsx';

// Keep in sync with the w-[420px] classes below: Tailwind cannot read a JS
// constant, so the value has to be written twice.
export const PREVIEW_PANEL_WIDTH = 420;

const EMBED_ORIGIN = 'https://platform.twitter.com';
const INITIAL_EMBED_HEIGHT = 300;
// The embed's load event fires before it renders the tweet; its first resize
// message is the real ready signal. This covers embeds that never send one,
// such as a deleted tweet.
const EMBED_READY_FALLBACK_MS = 1500;

function EmbedSkeleton() {
  return (
    <div
      data-testid="embed-skeleton"
      aria-hidden="true"
      className="absolute inset-x-0 top-0 animate-pulse rounded-2xl border border-line p-4"
    >
      <div className="flex items-center gap-3">
        <span className="size-10 rounded-full bg-black/[0.07]" />
        <div className="flex-1 space-y-2">
          <span className="block h-2.5 w-1/2 rounded-full bg-black/[0.07]" />
          <span className="block h-2.5 w-1/3 rounded-full bg-black/[0.05]" />
        </div>
      </div>
      <span className="mt-4 block h-2.5 w-11/12 rounded-full bg-black/[0.06]" />
      <span className="mt-2 block h-2.5 w-2/3 rounded-full bg-black/[0.06]" />
      <span className="mt-4 block aspect-video rounded-xl bg-black/[0.05]" />
    </div>
  );
}

export function PreviewPanel({ tweet, onClose, overlay = false }) {
  const [embedHeight, setEmbedHeight] = useState(INITIAL_EMBED_HEIGHT);
  const [embedReady, setEmbedReady] = useState(false);
  const readyTimerRef = useRef(0);

  useEffect(() => {
    setEmbedHeight(INITIAL_EMBED_HEIGHT);
    setEmbedReady(false);
    return () => clearTimeout(readyTimerRef.current);
  }, [tweet?.id]);

  // The X embed reports its content height over postMessage; size the iframe to it.
  useEffect(() => {
    function handleMessage(e) {
      if (e.origin !== EMBED_ORIGIN) return;
      const embed = e.data?.['twttr.embed'];
      if (embed?.method !== 'twttr.private.resize') return;
      const height = embed.params?.[0]?.height;
      if (typeof height === 'number' && height > 0) {
        setEmbedHeight(height);
        setEmbedReady(true);
      }
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

  const savedAt = tweet ? bookmarkedAt(tweet) : null;

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
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold leading-tight">Önizleme</h2>
              {savedAt && (
                <p className="truncate text-[11.5px] tabular-nums text-muted">
                  Kaydedildi:{' '}
                  <time dateTime={savedAt}>{formatDayTime(savedAt)}</time>
                </p>
              )}
            </div>
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
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="relative">
              {!embedReady && <EmbedSkeleton />}
              <iframe
                key={tweet.id}
                title="Tweet önizleme"
                sandbox="allow-scripts allow-same-origin allow-popups"
                src={`https://platform.twitter.com/embed/Tweet.html?id=${tweet.id}&theme=light`}
                onLoad={() => {
                  clearTimeout(readyTimerRef.current);
                  readyTimerRef.current = setTimeout(
                    () => setEmbedReady(true),
                    EMBED_READY_FALLBACK_MS
                  );
                }}
                style={{ height: `${embedHeight}px` }}
                className={cn(
                  'w-full border-0 transition-opacity duration-[var(--dur-base)]',
                  embedReady ? 'opacity-100' : 'opacity-0'
                )}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
