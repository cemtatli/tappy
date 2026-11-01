// sortIndex is X's numeric cursor as a decimal string, too big for a Number.
// Without leading zeros the longer string is the larger value and equal lengths
// compare lexically, which sorts large libraries far faster than BigInt parsing.
export function bySortIndexDesc(a, b) {
  const x = a.sortIndex;
  const y = b.sortIndex;
  return y.length - x.length || (y > x ? 1 : y < x ? -1 : 0);
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
