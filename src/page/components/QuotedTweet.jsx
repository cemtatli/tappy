import { useState } from 'react';
import { Avatar } from './Avatar.jsx';
import { cn } from '../lib/cn.js';
import { displayUrl } from '../lib/media.js';

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function QuotedMediaImg({ url }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative max-h-64 overflow-hidden">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-surface" />}
      <img
        src={displayUrl(url)}
        loading="lazy"
        decoding="async"
        alt=""
        onLoad={() => setLoaded(true)}
        className={cn(
          'max-h-64 w-full object-cover transition-opacity duration-[var(--dur-base)]',
          loaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}

export function QuotedTweet({ quoted }) {
  if (!quoted) return null;

  const open = () =>
    window.open(quoted.tweetUrl, '_blank', 'noopener,noreferrer');

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="mt-3 cursor-pointer rounded-2xl border border-line p-3 transition-colors hover:bg-surface"
    >
      <div className="flex items-center gap-1 text-[14px] leading-5">
        <Avatar name={quoted.authorName} src={quoted.avatarUrl} size={20} />
        <strong className="truncate">{quoted.authorName}</strong>
        <span className="truncate text-muted">@{quoted.authorHandle}</span>
        <span className="text-muted">·</span>
        <time className="shrink-0 text-muted">
          {formatShortDate(quoted.createdAt)}
        </time>
      </div>
      {quoted.text && (
        <p className="mt-1 whitespace-pre-wrap break-words text-[14px] line-clamp-4">
          {quoted.text}
        </p>
      )}
      {quoted.mediaUrls.length > 0 && (
        <div
          className={cn(
            'mt-2 grid gap-0.5 overflow-hidden rounded-xl border border-line',
            quoted.mediaUrls.length > 1 && 'grid-cols-2'
          )}
        >
          {quoted.mediaUrls.map((url) => (
            <QuotedMediaImg key={url} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}
