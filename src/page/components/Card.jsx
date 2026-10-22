import { ExternalLink, Download, PanelRight, Trash2 } from 'lucide-react';
import { Avatar } from './Avatar.jsx';
import { StatsRow } from './StatsRow.jsx';
import { Checkbox } from './ui/Checkbox.jsx';
import { Button } from './ui/Button.jsx';
import { QuotedTweet } from './QuotedTweet.jsx';
import { MediaGrid } from './MediaGrid.jsx';

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function Card({
  tweet,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onExportOne,
  onUnmarkOne,
  onPreview,
  onStatus,
  showActions = true,
}) {
  return (
    <article
      data-tweet-id={tweet.id}
      className="flex gap-3 p-4 transition-colors hover:bg-surface"
    >
      {selectionMode && (
        <Checkbox
          aria-label={`${tweet.authorName} seç`}
          checked={selected}
          onCheckedChange={() => onToggleSelect?.(tweet.id)}
        />
      )}
      <Avatar name={tweet.authorName} src={tweet.avatarUrl} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 text-[15px] leading-5">
          <strong className="truncate">{tweet.authorName}</strong>
          <span className="truncate text-muted">@{tweet.authorHandle}</span>
          <span className="text-muted">·</span>
          <time className="shrink-0 text-muted">
            {formatShortDate(tweet.createdAt)}
          </time>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words">{tweet.text}</p>
        <MediaGrid tweet={tweet} onStatus={onStatus} />
        {tweet.quoted && <QuotedTweet quoted={tweet.quoted} />}
        <div className="mt-3 flex items-center">
          <StatsRow stats={tweet.stats} />
          <span className="flex-1" />
          {showActions && (
            <div className="flex items-center text-muted">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Export"
                onClick={() => onExportOne?.(tweet.id)}
                className="size-8 min-w-8 px-0 text-muted hover:text-text"
              >
                <Download size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Unmark"
                onClick={() => onUnmarkOne?.(tweet.id)}
                className="size-8 min-w-8 px-0 text-muted hover:text-danger"
              >
                <Trash2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Önizle"
                onClick={() => onPreview?.(tweet.id)}
                className="size-8 min-w-8 px-0 text-muted hover:text-accent"
              >
                <PanelRight size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="X'te aç"
                onClick={() =>
                  window.open(tweet.tweetUrl, '_blank', 'noopener,noreferrer')
                }
                className="size-8 min-w-8 px-0 text-muted hover:text-accent"
              >
                <ExternalLink size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
