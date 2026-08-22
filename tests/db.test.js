import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import {
  openDb,
  putTweets,
  getAllTweets,
  deleteTweetById,
  getMeta,
  setMeta,
  listCategories,
  putCategory,
  deleteCategory,
  setTweetCategory,
} from '../src/shared/db.js';

function tweet(id, sortIndex) {
  return {
    id,
    sortIndex,
    authorHandle: 'foo',
    authorName: 'Foo',
    text: `tweet ${id}`,
    createdAt: '2026-07-02T12:00:00.000Z',
    mediaUrls: [],
    tweetUrl: `https://x.com/foo/status/${id}`,
    cachedAt: '2026-07-02T12:30:00.000Z',
  };
}

beforeEach(() => {
  indexedDB = new IDBFactory();
});

describe('db', () => {
  it('putTweets + getAllTweets returns tweets sorted by sortIndex desc', async () => {
    const db = await openDb();
    await putTweets(db, [
      tweet('1', '1000'),
      tweet('2', '3000'),
      tweet('3', '2000'),
    ]);
    const all = await getAllTweets(db);
    expect(all.map((t) => t.id)).toEqual(['2', '3', '1']);
  });

  it('putTweets upserts by id (no duplicates)', async () => {
    const db = await openDb();
    await putTweets(db, [tweet('1', '1000')]);
    await putTweets(db, [{ ...tweet('1', '1000'), text: 'updated' }]);
    const all = await getAllTweets(db);
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe('updated');
  });

  it('deleteTweetById removes the tweet', async () => {
    const db = await openDb();
    await putTweets(db, [tweet('1', '1000'), tweet('2', '2000')]);
    await deleteTweetById(db, '1');
    const all = await getAllTweets(db);
    expect(all.map((t) => t.id)).toEqual(['2']);
  });

  it('getMeta returns null for missing key, setMeta+getMeta round-trips', async () => {
    const db = await openDb();
    expect(await getMeta(db, 'olderCursor')).toBeNull();
    await setMeta(db, 'olderCursor', 'CURSOR_XYZ');
    expect(await getMeta(db, 'olderCursor')).toBe('CURSOR_XYZ');
  });
});

describe('categories (v2)', () => {
  it('listCategories starts empty and returns categories sorted by order after putCategory', async () => {
    const db = await openDb();
    expect(await listCategories(db)).toEqual([]);
    await putCategory(db, {
      id: 'c2',
      name: 'B',
      order: 1,
      createdAt: '2026-01-02',
    });
    await putCategory(db, {
      id: 'c1',
      name: 'A',
      order: 0,
      createdAt: '2026-01-01',
    });
    const cats = await listCategories(db);
    expect(cats.map((c) => c.id)).toEqual(['c1', 'c2']);
    db.close();
  });

  it('setTweetCategory assigns individually and in bulk, skips unknown ids', async () => {
    const db = await openDb();
    await putTweets(db, [
      { id: 't1', sortIndex: '1' },
      { id: 't2', sortIndex: '2' },
    ]);
    await setTweetCategory(db, ['t1', 't2', 'yok'], 'c1');
    const all = await getAllTweets(db);
    expect(all.every((t) => t.categoryId === 'c1')).toBe(true);
    await setTweetCategory(db, ['t1'], null);
    const t1 = (await getAllTweets(db)).find((t) => t.id === 't1');
    expect(t1.categoryId).toBeNull();
    db.close();
  });

  it('deleteCategory removes the category and un-categorises its tweets', async () => {
    const db = await openDb();
    await putCategory(db, {
      id: 'c1',
      name: 'A',
      order: 0,
      createdAt: '2026-01-01',
    });
    await putTweets(db, [{ id: 't1', sortIndex: '1', categoryId: 'c1' }]);
    await deleteCategory(db, 'c1');
    expect(await listCategories(db)).toEqual([]);
    const t1 = (await getAllTweets(db)).find((t) => t.id === 't1');
    expect(t1.categoryId).toBeNull();
    db.close();
  });

  it('v1→v2 upgrade preserves existing tweets and adds the categories store', async () => {
    // Simulate a real v1 user scenario: manually create and populate a DB with
    // only tweets+meta stores (v1 schema).
    const v1db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('x-bookmarker', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.createObjectStore('tweets', { keyPath: 'id' });
        store.createIndex('sortIndex', 'sortIndex');
        db.createObjectStore('meta', { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const tx = v1db.transaction('tweets', 'readwrite');
      tx.objectStore('tweets').put({ id: 't1', sortIndex: '5' });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    v1db.close();

    // Now upgrade to v2 using the real openDb() (oldVersion === 1).
    const db = await openDb();

    // Existing tweet should still be readable...
    const all = await getAllTweets(db);
    expect(all.map((t) => t.id)).toEqual(['t1']);

    // ...and the categories store should have been added.
    expect(await listCategories(db)).toEqual([]);
    db.close();
  });
});
