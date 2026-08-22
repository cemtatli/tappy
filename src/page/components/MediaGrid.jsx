import { useState } from 'react';
import { Copy, ImageDown } from 'lucide-react';
import { cn } from '../lib/cn.js';
import {
  copyImageToClipboard,
  displayUrl,
  downloadImage,
  extFromUrl,
} from '../lib/media.js';

function MediaImg({ url, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-full">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface" />}
      <img
        src={displayUrl(url)}
        loading="lazy"
        decoding="async"
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-[var(--dur-base)]',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

export function MediaGrid({ tweet, onStatus }) {
  const { mediaUrls } = tweet;
  if (mediaUrls.length === 0) return null;

  async function handleCopy(url) {
    try {
      await copyImageToClipboard(url);
      onStatus?.('Panoya kopyalandı.');
    } catch (err) {
      onStatus?.(`Kopyalama başarısız: ${err.message}`);
    }
  }

  async function handleDownload(url, index) {
    const filename = `${tweet.authorHandle}-${tweet.id}-${index + 1}.${extFromUrl(url)}`;
    try {
      await downloadImage(url, filename);
      onStatus?.('Görsel indirildi.');
    } catch (err) {
      onStatus?.(`İndirme başarısız: ${err.message}`);
    }
  }

  const buttonClass =
    'rounded-full bg-white/80 p-2 text-text backdrop-blur border border-line transition-colors hover:bg-white hover:text-accent';

  return (
    <div
      className={cn(
        'mt-3 grid gap-0.5 overflow-hidden rounded-2xl border border-line',
        mediaUrls.length > 1 && 'grid-cols-2'
      )}
    >
      {mediaUrls.map((url, index) => (
        <div key={url} className="group/media relative h-full">
          <MediaImg url={url} alt={`${tweet.authorName} tweet medyası`} />
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover/media:opacity-100">
            <button
              type="button"
              aria-label="Görseli panoya kopyala"
              onClick={() => handleCopy(url)}
              className={buttonClass}
            >
              <Copy size={14} />
            </button>
            <button
              type="button"
              aria-label="Görseli indir"
              onClick={() => handleDownload(url, index)}
              className={buttonClass}
            >
              <ImageDown size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
