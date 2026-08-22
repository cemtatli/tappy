import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import {
  openDb,
  putTweets,
  getAllTweets,
  listCollections,
  putCollection,
  deleteCollection,
  addImagesToCollection,
  removeImagesFromCollection,
} from '../src/shared/db.js';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

function col(id, name, order) {
  return {
    id,
    name,
    order,
    createdAt: '2026-07-22T00:00:00.000Z',
    imageKeys: [],
  };
}

describe('collections store', () => {
  it('put / list sorted by order then createdAt', async () => {
    const db = await openDb();
    await putCollection(db, col('b', 'B', 2));
    await putCollection(db, col('a', 'A', 1));
    const list = await listCollections(db);
    expect(list.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('delete removes a collection', async () => {
    const db = await openDb();
    await putCollection(db, col('a', 'A', 1));
    await deleteCollection(db, 'a');
    expect(await listCollections(db)).toHaveLength(0);
  });

  it('addImagesToCollection unions + dedups', async () => {
    const db = await openDb();
    await putCollection(db, col('a', 'A', 1));
    await addImagesToCollection(db, 'a', ['100:0', '100:1']);
    await addImagesToCollection(db, 'a', ['100:1', '200:0']);
    const [c] = await listCollections(db);
    expect(c.imageKeys.sort()).toEqual(['100:0', '100:1', '200:0']);
  });

  it('removeImagesFromCollection drops keys', async () => {
    const db = await openDb();
    await putCollection(db, col('a', 'A', 1));
    await addImagesToCollection(db, 'a', ['100:0', '100:1', '200:0']);
    await removeImagesFromCollection(db, 'a', ['100:1']);
    const [c] = await listCollections(db);
    expect(c.imageKeys.sort()).toEqual(['100:0', '200:0']);
  });

  it('v3 migration keeps existing tweets intact', async () => {
    const db = await openDb();
    await putTweets(db, [
      {
        id: '1',
        sortIndex: '1',
        authorHandle: 'foo',
        authorName: 'Foo',
        text: 't',
        createdAt: '2026-07-02T12:00:00.000Z',
        mediaUrls: [],
        tweetUrl: 'https://x.com/foo/status/1',
        cachedAt: '2026-07-02T12:30:00.000Z',
      },
    ]);
    expect(await getAllTweets(db)).toHaveLength(1);
    expect(await listCollections(db)).toHaveLength(0);
  });
});
