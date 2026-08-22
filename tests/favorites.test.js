import 'fake-indexeddb/auto';
import { beforeEach, describe, it, expect } from 'vitest';
import {
  openDb,
  listCollections,
  ensureFavoritesCollection,
  FAVORITES_ID,
} from '../src/shared/db.js';

beforeEach(() => {
  indexedDB = new IDBFactory();
});

describe('ensureFavoritesCollection', () => {
  it('creates the Favoriler collection when absent', async () => {
    const db = await openDb();
    await ensureFavoritesCollection(db);
    const cols = await listCollections(db);
    expect(cols).toHaveLength(1);
    const fav = cols[0];
    expect(fav.id).toBe(FAVORITES_ID);
    expect(fav.name).toBe('Favoriler');
    expect(fav.color).toBe('#ff2d55');
    expect(fav.imageKeys).toEqual([]);
  });

  it('is idempotent — calling twice does not duplicate', async () => {
    const db = await openDb();
    await ensureFavoritesCollection(db);
    await ensureFavoritesCollection(db);
    const cols = await listCollections(db);
    expect(cols).toHaveLength(1);
    expect(cols[0].id).toBe(FAVORITES_ID);
  });

  it('preserves existing imageKeys when called a second time', async () => {
    const db = await openDb();
    await ensureFavoritesCollection(db);
    // Manually add a key to favorites, then call ensure again
    const { addImagesToCollection } = await import('../src/shared/db.js');
    await addImagesToCollection(db, FAVORITES_ID, ['123:0']);
    await ensureFavoritesCollection(db);
    const cols = await listCollections(db);
    expect(cols[0].imageKeys).toEqual(['123:0']);
  });
});
