function bySortIndexDesc(a, b) {
  const diff = BigInt(b.sortIndex) - BigInt(a.sortIndex);
  return diff > 0n ? 1 : diff < 0n ? -1 : 0;
}

export function sortTweets(tweets, mode = 'date-desc') {
  const arr = tweets.slice();
  if (mode === 'date-asc') {
    arr.sort((a, b) => bySortIndexDesc(b, a));
  } else if (mode === 'likes-desc') {
    arr.sort(
      (a, b) =>
        (b.stats?.likes ?? 0) - (a.stats?.likes ?? 0) || bySortIndexDesc(a, b)
    );
  } else {
    arr.sort(bySortIndexDesc);
  }
  return arr;
}
