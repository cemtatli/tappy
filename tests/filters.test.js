import { describe, it, expect } from 'vitest';
import { applyFilters } from '../src/shared/filters.js';

const tweets = [
  {
    id: '1',
    authorHandle: 'alice',
    authorName: 'Alice A',
    text: 'merhaba dünya',
    createdAt: '2026-07-01T10:00:00.000Z',
    mediaUrls: [],
  },
  {
    id: '2',
    authorHandle: 'bob',
    authorName: 'Bob B',
    text: 'foo bar',
    createdAt: '2026-07-03T10:00:00.000Z',
    mediaUrls: ['https://a.com/x.jpg'],
  },
];

describe('applyFilters', () => {
  it('returns all tweets when no filters given', () => {
    expect(applyFilters(tweets, {})).toHaveLength(2);
  });

  it('filters by search text across text/author', () => {
    expect(applyFilters(tweets, { search: 'dünya' }).map((t) => t.id)).toEqual([
      '1',
    ]);
    expect(applyFilters(tweets, { search: 'bob' }).map((t) => t.id)).toEqual([
      '2',
    ]);
    expect(applyFilters(tweets, { search: 'Alice' }).map((t) => t.id)).toEqual([
      '1',
    ]);
  });

  it('is case-insensitive', () => {
    expect(applyFilters(tweets, { search: 'FOO' }).map((t) => t.id)).toEqual([
      '2',
    ]);
  });
});
