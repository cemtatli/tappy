import { describe, it, expect } from 'vitest';
import { sortTweets } from '../src/shared/sort.js';

const T = (id, sortIndex, likes) => ({
  id,
  sortIndex,
  stats: likes === undefined ? undefined : { likes, retweets: 0, replies: 0 },
});

describe('sortTweets', () => {
  const tweets = [T('a', '100', 5), T('b', '300', 1), T('c', '200', undefined)];

  it('date-desc default: descending sortIndex', () => {
    expect(sortTweets(tweets).map((t) => t.id)).toEqual(['b', 'c', 'a']);
  });

  it('date-asc: ascending sortIndex', () => {
    expect(sortTweets(tweets, 'date-asc').map((t) => t.id)).toEqual([
      'a',
      'c',
      'b',
    ]);
  });

  it('likes-desc: descending likes, 0 when stats absent, newer first on tie', () => {
    expect(sortTweets(tweets, 'likes-desc').map((t) => t.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('does not mutate the input array', () => {
    const copy = tweets.slice();
    sortTweets(tweets, 'date-asc');
    expect(tweets).toEqual(copy);
  });
});
