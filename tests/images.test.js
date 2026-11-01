import { describe, it, expect } from 'vitest';
import {
  imageKeyFor,
  parseImageKey,
  flattenImages,
  imagesForCollection,
} from '../src/shared/images.js';

const tweets = [
  {
    id: '100',
    authorHandle: 'alice',
    authorName: 'Alice',
    tweetUrl: 'https://x.com/alice/status/100',
    mediaUrls: ['https://pbs.twimg.com/a.jpg', 'https://pbs.twimg.com/b.jpg'],
  },
  {
    id: '200',
    authorHandle: 'bob',
    authorName: 'Bob',
    tweetUrl: 'https://x.com/bob/status/200',
    mediaUrls: [],
  },
  {
    id: '300',
    authorHandle: 'carol',
    authorName: 'Carol',
    tweetUrl: 'https://x.com/carol/status/300',
    mediaUrls: ['https://pbs.twimg.com/c.jpg'],
  },
];

describe('imageKeyFor / parseImageKey', () => {
  it('round-trips', () => {
    const key = imageKeyFor('100', 1);
    expect(key).toBe('100:1');
    expect(parseImageKey(key)).toEqual({ tweetId: '100', mediaIndex: 1 });
  });
});

describe('flattenImages', () => {
  it('one record per image, text-only tweets excluded', () => {
    const imgs = flattenImages(tweets);
    expect(imgs).toHaveLength(3);
    expect(imgs.map((i) => i.imageKey)).toEqual(['100:0', '100:1', '300:0']);
    expect(imgs[0]).toEqual({
      imageKey: '100:0',
      tweetId: '100',
      mediaIndex: 0,
      mediaCount: 2,
      url: 'https://pbs.twimg.com/a.jpg',
      authorHandle: 'alice',
      authorName: 'Alice',
      authorAvatarUrl: null,
      text: '',
      likeCount: 0,
      createdAt: null,
      bookmarkedAt: null,
      tweetUrl: 'https://x.com/alice/status/100',
    });
  });
});

describe('imagesForCollection', () => {
  it('maps keys in collection order, skips orphans', () => {
    const tweetsById = new Map(tweets.map((t) => [t.id, t]));
    const collection = { imageKeys: ['300:0', '100:1', '999:0'] };
    const imgs = imagesForCollection(collection, tweetsById);
    expect(imgs.map((i) => i.imageKey)).toEqual(['300:0', '100:1']);
  });
});
