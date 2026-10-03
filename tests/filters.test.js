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
    stats: { likes: 5 },
  },
  {
    id: '2',
    authorHandle: 'bob',
    authorName: 'Bob B',
    text: 'foo bar',
    createdAt: '2026-07-03T10:00:00.000Z',
    mediaUrls: ['https://a.com/x.jpg'],
    stats: { likes: 100 },
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

  it('trims search and accepts an author name or @handle', () => {
    expect(
      applyFilters(tweets, { search: '  FOO  ', author: ' @BOB ' }).map(
        (t) => t.id
      )
    ).toEqual(['2']);
    expect(
      applyFilters(tweets, { author: 'alice a' }).map((t) => t.id)
    ).toEqual(['1']);
    expect(applyFilters(tweets, { search: 'foo', author: 'alice' })).toEqual(
      []
    );
    expect(applyFilters(tweets, { search: '  ' })).toHaveLength(2);
  });

  it('includes the entire local end day and excludes the next day', () => {
    const dated = [
      {
        id: 'before',
        createdAt: new Date(2026, 6, 2, 23, 59, 59, 999).toISOString(),
      },
      { id: 'start', createdAt: new Date(2026, 6, 3).toISOString() },
      {
        id: 'end',
        createdAt: new Date(2026, 6, 3, 23, 59, 59, 999).toISOString(),
      },
      { id: 'after', createdAt: new Date(2026, 6, 4).toISOString() },
      { id: 'unknown' },
    ];
    expect(
      applyFilters(dated, { dateFrom: '2026-07-03', dateTo: '2026-07-03' }).map(
        (t) => t.id
      )
    ).toEqual(['start', 'end']);
    expect(
      applyFilters(dated, { dateFrom: '2026-07-04' }).map((t) => t.id)
    ).toEqual(['after']);
    expect(
      applyFilters(dated, { dateTo: '2026-07-02' }).map((t) => t.id)
    ).toEqual(['before']);
  });

  it('returns no matches for reversed dates and ignores malformed dates', () => {
    expect(
      applyFilters(tweets, { dateFrom: '2026-07-04', dateTo: '2026-07-01' })
    ).toEqual([]);
    expect(
      applyFilters(tweets, { dateFrom: 'invalid', dateTo: '2026-02-30' })
    ).toHaveLength(2);
  });

  it('combines media and inclusive minimum likes filters', () => {
    expect(
      applyFilters(tweets, { media: 'with-media', minLikes: '100' }).map(
        (t) => t.id
      )
    ).toEqual(['2']);
    expect(
      applyFilters(tweets, { media: 'text-only' }).map((t) => t.id)
    ).toEqual(['1']);
    expect(applyFilters(tweets, { minLikes: '101' })).toEqual([]);
    expect(applyFilters([{ id: 'missing' }], { minLikes: '1' })).toEqual([]);
    expect(applyFilters(tweets, { minLikes: '' })).toHaveLength(2);
  });
});
