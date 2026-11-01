import { describe, it, expect } from 'vitest';
import {
  bookmarkedAt,
  parseBookmarksResponse,
} from '../src/shared/tweetModel.js';

function makeFixture() {
  return {
    data: {
      bookmark_timeline_v2: {
        timeline: {
          instructions: [
            {
              type: 'TimelineAddEntries',
              entries: [
                {
                  entryId: 'tweet-111',
                  sortIndex: '2000',
                  content: {
                    entryType: 'TimelineTimelineItem',
                    itemContent: {
                      itemType: 'TimelineTweet',
                      tweet_results: {
                        result: {
                          __typename: 'Tweet',
                          rest_id: '111',
                          legacy: {
                            full_text: 'merhaba dünya',
                            created_at: 'Wed Jul 02 12:00:00 +0000 2026',
                            entities: {
                              media: [
                                {
                                  media_url_https:
                                    'https://pbs.twimg.com/media/a.jpg',
                                  type: 'photo',
                                },
                              ],
                            },
                          },
                          core: {
                            user_results: {
                              result: {
                                legacy: {
                                  screen_name: 'testuser',
                                  name: 'Test User',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                {
                  entryId: 'tweet-222',
                  sortIndex: '1000',
                  content: {
                    entryType: 'TimelineTimelineItem',
                    itemContent: {
                      itemType: 'TimelineTweet',
                      tweet_results: {
                        result: {
                          __typename: 'Tweet',
                          rest_id: '222',
                          legacy: {
                            full_text: 'kısa metin',
                            created_at: 'Wed Jul 02 11:00:00 +0000 2026',
                          },
                          note_tweet: {
                            note_tweet_results: {
                              result: { text: 'uzun tweet metni burada' },
                            },
                          },
                          core: {
                            user_results: {
                              result: {
                                core: {
                                  screen_name: 'other',
                                  name: 'Other User',
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                {
                  entryId: 'cursor-bottom-1',
                  content: {
                    entryType: 'TimelineTimelineCursor',
                    cursorType: 'Bottom',
                    value: 'CURSOR_ABC',
                  },
                },
              ],
            },
          ],
        },
      },
    },
  };
}

describe('parseBookmarksResponse', () => {
  it('extracts tweets with expected fields', () => {
    const { tweets, nextCursor } = parseBookmarksResponse(
      makeFixture(),
      '2026-07-02T12:30:00.000Z'
    );

    expect(tweets).toHaveLength(2);
    expect(tweets[0]).toEqual({
      id: '111',
      sortIndex: '2000',
      authorHandle: 'testuser',
      authorName: 'Test User',
      text: 'merhaba dünya',
      createdAt: new Date('Wed Jul 02 12:00:00 +0000 2026').toISOString(),
      mediaUrls: ['https://pbs.twimg.com/media/a.jpg'],
      tweetUrl: 'https://x.com/testuser/status/111',
      cachedAt: '2026-07-02T12:30:00.000Z',
      avatarUrl: null,
      stats: { likes: 0, retweets: 0, replies: 0 },
      quoted: null,
    });
    expect(nextCursor).toBe('CURSOR_ABC');
  });

  it('prefers note_tweet text over legacy.full_text for long tweets', () => {
    const { tweets } = parseBookmarksResponse(
      makeFixture(),
      '2026-07-02T12:30:00.000Z'
    );
    expect(tweets[1].text).toBe('uzun tweet metni burada');
  });

  it("reads author from user's core field (X 2024+ schema) when legacy has no name/screen_name", () => {
    const { tweets } = parseBookmarksResponse(
      makeFixture(),
      '2026-07-02T12:30:00.000Z'
    );
    expect(tweets[1].authorHandle).toBe('other');
    expect(tweets[1].authorName).toBe('Other User');
  });

  it('skips a tweet whose user has neither core nor legacy name/screen_name', () => {
    const fixture = makeFixture();
    fixture.data.bookmark_timeline_v2.timeline.instructions[0].entries[0].content.itemContent.tweet_results.result.core.user_results.result =
      {};
    const { tweets } = parseBookmarksResponse(
      fixture,
      '2026-07-02T12:30:00.000Z'
    );
    expect(tweets.map((t) => t.id)).toEqual(['222']);
  });

  it('returns empty tweets and null cursor for empty response', () => {
    const result = parseBookmarksResponse(
      { data: {} },
      '2026-07-02T12:30:00.000Z'
    );
    expect(result).toEqual({ tweets: [], nextCursor: null });
  });

  it('parses a quoted post nested under quoted_status_result', () => {
    const fixture = makeFixture();
    fixture.data.bookmark_timeline_v2.timeline.instructions[0].entries[0].content.itemContent.tweet_results.result.quoted_status_result =
      {
        result: {
          __typename: 'Tweet',
          rest_id: '999',
          legacy: {
            full_text: 'alıntılanan metin',
            created_at: 'Wed Jul 01 09:00:00 +0000 2026',
            entities: {
              media: [
                {
                  media_url_https: 'https://pbs.twimg.com/q.jpg',
                  type: 'photo',
                },
              ],
            },
          },
          core: {
            user_results: {
              result: { core: { screen_name: 'quoted', name: 'Quoted User' } },
            },
          },
        },
      };
    const { tweets } = parseBookmarksResponse(
      fixture,
      '2026-07-02T12:30:00.000Z'
    );
    expect(tweets[0].quoted).toEqual({
      authorName: 'Quoted User',
      authorHandle: 'quoted',
      avatarUrl: null,
      text: 'alıntılanan metin',
      mediaUrls: ['https://pbs.twimg.com/q.jpg'],
      tweetUrl: 'https://x.com/quoted/status/999',
      createdAt: new Date('Wed Jul 01 09:00:00 +0000 2026').toISOString(),
    });
  });

  it('unwraps a TweetWithVisibilityResults quoted result', () => {
    const fixture = makeFixture();
    fixture.data.bookmark_timeline_v2.timeline.instructions[0].entries[0].content.itemContent.tweet_results.result.quoted_status_result =
      {
        result: {
          __typename: 'TweetWithVisibilityResults',
          tweet: {
            __typename: 'Tweet',
            rest_id: '888',
            legacy: {
              full_text: 'gizli quote',
              created_at: 'Wed Jul 01 08:00:00 +0000 2026',
            },
            core: {
              user_results: {
                result: { core: { screen_name: 'vis', name: 'Vis User' } },
              },
            },
          },
        },
      };
    const { tweets } = parseBookmarksResponse(fixture, 'x');
    expect(tweets[0].quoted.authorHandle).toBe('vis');
    expect(tweets[0].quoted.text).toBe('gizli quote');
  });

  it('leaves quoted null when there is no quote', () => {
    const { tweets } = parseBookmarksResponse(makeFixture(), 'x');
    expect(tweets[1].quoted).toBeNull();
  });
});

describe('avatarUrl and stats fields', () => {
  function makeResponse(overrides = {}) {
    const {
      userLegacyExtra = {},
      userCoreExtra = {},
      userResultExtra = {},
      legacyExtra = {},
    } = overrides;
    return {
      data: {
        bookmark_timeline_v2: {
          timeline: {
            instructions: [
              {
                type: 'TimelineAddEntries',
                entries: [
                  {
                    sortIndex: '100',
                    content: {
                      entryType: 'TimelineTimelineItem',
                      itemContent: {
                        itemType: 'TimelineTweet',
                        tweet_results: {
                          result: {
                            __typename: 'Tweet',
                            rest_id: '1',
                            legacy: {
                              full_text: 'merhaba',
                              created_at: 'Mon Jul 01 10:00:00 +0000 2024',
                              ...legacyExtra,
                            },
                            core: {
                              user_results: {
                                result: {
                                  core: {
                                    screen_name: 'tappy',
                                    name: 'Tappy',
                                    ...userCoreExtra,
                                  },
                                  legacy: { ...userLegacyExtra },
                                  ...userResultExtra,
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    };
  }

  it('reads avatar from user result level (2024+ schema) and it takes priority', () => {
    const json = makeResponse({
      userResultExtra: {
        avatar: { image_url: 'https://pbs.twimg.com/r_normal.jpg' },
      },
      userCoreExtra: {
        avatar: { image_url: 'https://pbs.twimg.com/c_normal.jpg' },
      },
      userLegacyExtra: {
        profile_image_url_https: 'https://pbs.twimg.com/l_normal.jpg',
      },
    });
    const { tweets } = parseBookmarksResponse(json, '2026-07-04T00:00:00.000Z');
    expect(tweets[0].avatarUrl).toBe('https://pbs.twimg.com/r_normal.jpg');
  });

  it('reads profile_image_url_https from userLegacy', () => {
    const json = makeResponse({
      userLegacyExtra: {
        profile_image_url_https: 'https://pbs.twimg.com/a_normal.jpg',
      },
    });
    const { tweets } = parseBookmarksResponse(json, '2026-07-04T00:00:00.000Z');
    expect(tweets[0].avatarUrl).toBe('https://pbs.twimg.com/a_normal.jpg');
  });

  it('supports userCore.avatar variant, falls back to null when neither is present', () => {
    const withCore = makeResponse({
      userCoreExtra: {
        avatar: { image_url: 'https://pbs.twimg.com/b_normal.jpg' },
      },
    });
    expect(parseBookmarksResponse(withCore, 'x').tweets[0].avatarUrl).toBe(
      'https://pbs.twimg.com/b_normal.jpg'
    );
    const bare = makeResponse();
    expect(parseBookmarksResponse(bare, 'x').tweets[0].avatarUrl).toBeNull();
  });

  it('reads stats from legacy counters, defaults to 0 when missing', () => {
    const withStats = makeResponse({
      legacyExtra: { favorite_count: 12, retweet_count: 3, reply_count: 5 },
    });
    expect(parseBookmarksResponse(withStats, 'x').tweets[0].stats).toEqual({
      likes: 12,
      retweets: 3,
      replies: 5,
    });
    const bare = makeResponse();
    expect(parseBookmarksResponse(bare, 'x').tweets[0].stats).toEqual({
      likes: 0,
      retweets: 0,
      replies: 0,
    });
  });
});

describe('bookmarkedAt', () => {
  const createdAt = '2026-10-31T00:00:00.000Z';

  it('decodes the bookmark time from the bits above the low 20', () => {
    const ms = Date.UTC(2026, 10, 1, 11, 16, 19, 362);
    const sortIndex = String((BigInt(ms) << 20n) | 763737n);
    expect(bookmarkedAt({ sortIndex, createdAt })).toBe(
      '2026-11-01T11:16:19.362Z'
    );
  });

  it('is unknown when the value lands before the tweet existed', () => {
    expect(bookmarkedAt({ sortIndex: '2000', createdAt })).toBeNull();
  });

  it('is unknown when the value lands in the future', () => {
    const sortIndex = String(BigInt(Date.now() + 1e10) << 20n);
    expect(bookmarkedAt({ sortIndex, createdAt })).toBeNull();
  });

  it('is unknown for a malformed or missing sortIndex', () => {
    expect(bookmarkedAt({ sortIndex: 'abc', createdAt })).toBeNull();
    expect(bookmarkedAt({ createdAt })).toBeNull();
  });
});
