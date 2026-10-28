export const EMPTY_FILTERS = {
  search: '',
  author: '',
  dateFrom: '',
  dateTo: '',
  media: 'all',
  minLikes: '',
};

// Date inputs describe local calendar days, including the entire final day.
function dayBoundary(value, nextDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  if (nextDay) date.setDate(date.getDate() + 1);
  return date.getTime();
}

// Folds case and accents so Turkish and accented text match however it is
// typed: "İzmir", "izmir" and "IZMIR" are equal, as are "café"/"cafe" and
// "şaşırt"/"sasirt". NFD splits letters from their marks (which also removes
// the stray dot "İ".toLowerCase() leaves); dotless ı has no mark to strip.
export function foldText(value) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ı/g, 'i');
}

// Folding every tweet on every keystroke is the expensive part of search, so
// the folded haystack is cached per tweet object.
const haystacks = new WeakMap();

function searchHaystack(tweet) {
  let hay = haystacks.get(tweet);
  if (hay === undefined) {
    hay = foldText(
      `${tweet.text ?? ''} ${tweet.authorName ?? ''} ${tweet.authorHandle ?? ''}`
    );
    haystacks.set(tweet, hay);
  }
  return hay;
}

export function applyFilters(tweets, filters = {}) {
  // Every word must appear, in any order: "native react" finds "React Native".
  const terms = foldText(filters.search).split(/\s+/).filter(Boolean);
  const author = (filters.author ?? '').trim().replace(/^@/, '').toLowerCase();
  const from = dayBoundary(filters.dateFrom);
  const to = dayBoundary(filters.dateTo, true);
  const minLikes = Number(filters.minLikes);

  return tweets.filter((t) => {
    if (terms.length) {
      const hay = searchHaystack(t);
      if (!terms.every((term) => hay.includes(term))) return false;
    }
    if (
      author &&
      !`${t.authorName ?? ''} ${t.authorHandle ?? ''}`
        .toLowerCase()
        .includes(author)
    )
      return false;
    if (from !== null || to !== null) {
      const createdAt = Date.parse(t.createdAt);
      if (!Number.isFinite(createdAt)) return false;
      if (from !== null && createdAt < from) return false;
      if (to !== null && createdAt >= to) return false;
    }
    const hasMedia = (t.mediaUrls?.length ?? 0) > 0;
    if (filters.media === 'with-media' && !hasMedia) return false;
    if (filters.media === 'text-only' && hasMedia) return false;
    if (
      Number.isFinite(minLikes) &&
      minLikes > 0 &&
      (t.stats?.likes ?? 0) < minLikes
    )
      return false;
    return true;
  });
}
