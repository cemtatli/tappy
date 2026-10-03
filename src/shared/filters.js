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

export function applyFilters(tweets, filters = {}) {
  const search = (filters.search ?? '').trim().toLowerCase();
  const author = (filters.author ?? '').trim().replace(/^@/, '').toLowerCase();
  const from = dayBoundary(filters.dateFrom);
  const to = dayBoundary(filters.dateTo, true);
  const minLikes = Number(filters.minLikes);

  return tweets.filter((t) => {
    if (search) {
      const hay =
        `${t.text ?? ''} ${t.authorName ?? ''} ${t.authorHandle ?? ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
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
