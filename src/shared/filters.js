export function applyFilters(tweets, filters = {}) {
  const { search } = filters;

  return tweets.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const hay = `${t.text} ${t.authorName} ${t.authorHandle}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
