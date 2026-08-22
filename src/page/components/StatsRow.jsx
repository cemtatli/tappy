import { MessageCircle, Repeat2, Heart } from 'lucide-react';

function formatCount(n) {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace('.', ',').replace(',0', '')} Mn`;
  if (n >= 1_000)
    return `${(n / 1_000).toFixed(1).replace('.', ',').replace(',0', '')} B`;
  return String(n);
}

export function StatsRow({ stats }) {
  const replies = stats?.replies ?? 0;
  const retweets = stats?.retweets ?? 0;
  const likes = stats?.likes ?? 0;
  return (
    <div className="flex items-center gap-6 text-[13px] text-muted">
      <span
        data-testid="stat-replies"
        className="flex items-center gap-1.5 transition-colors hover:text-accent"
      >
        <MessageCircle size={16} /> {formatCount(replies)}
      </span>
      <span
        data-testid="stat-retweets"
        className="flex items-center gap-1.5 transition-colors hover:text-success"
      >
        <Repeat2 size={16} /> {formatCount(retweets)}
      </span>
      <span
        data-testid="stat-likes"
        className="flex items-center gap-1.5 transition-colors hover:text-[#f91880]"
      >
        <Heart size={16} /> {formatCount(likes)}
      </span>
    </div>
  );
}
