import Dexie from 'dexie';
import { bySortIndexDesc } from './sort.js';

export const FAVORITES_ID = '__favorites__';
const DB_NAME = 'x-bookmarker';

// Dexie stores version n as IndexedDB version n * 10. The hand-written schema
// this replaces reached IndexedDB version 3; version 1 here (IDB 10) declares
// the same stores and keys, so opening an existing database only bumps the
// version number and keeps every record.
function defineSchema(db) {
  db.version(1).stores({
    tweets: 'id, sortIndex',
    meta: 'key',
    categories: 'id',
    collections: 'id',
  });
}

export async function openDb() {
  // Resolve the factory at open time rather than import time, so tests can
  // swap in a fresh fake-indexeddb instance per case.
  const db = new Dexie(DB_NAME, {
    indexedDB: globalThis.indexedDB,
    IDBKeyRange: globalThis.IDBKeyRange,
  });
  defineSchema(db);
  await db.open();
  return db;
}

function byOrderThenCreated(a, b) {
  return a.order - b.order || a.createdAt.localeCompare(b.createdAt);
}

export async function putTweets(db, tweets) {
  await db.tweets.bulkPut(tweets);
}

export async function getAllTweets(db) {
  const tweets = await db.tweets.toArray();
  return tweets.sort(bySortIndexDesc);
}

export async function deleteTweetById(db, id) {
  await db.tweets.delete(id);
}

export async function getMeta(db, key) {
  const entry = await db.meta.get(key);
  return entry?.value ?? null;
}

export async function setMeta(db, key, value) {
  await db.meta.put({ key, value });
}

export async function listCategories(db) {
  const categories = await db.categories.toArray();
  return categories.sort(byOrderThenCreated);
}

export async function putCategory(db, category) {
  await db.categories.put(category);
}

export async function deleteCategory(db, id) {
  await db.transaction('rw', db.categories, db.tweets, async () => {
    await db.categories.delete(id);
    await db.tweets
      .filter((tweet) => tweet.categoryId === id)
      .modify({ categoryId: null });
  });
}

export async function setTweetCategory(db, ids, categoryId) {
  await db.tweets.where(':id').anyOf(ids).modify({ categoryId });
}

export async function listCollections(db) {
  const collections = await db.collections.toArray();
  return collections.sort(byOrderThenCreated);
}

export async function putCollection(db, collection) {
  await db.collections.put(collection);
}

export async function deleteCollection(db, id) {
  await db.collections.delete(id);
}

async function mutateCollectionKeys(db, id, mutate) {
  await db.collections
    .where(':id')
    .equals(id)
    .modify((collection) => {
      collection.imageKeys = mutate(collection.imageKeys ?? []);
    });
}

export async function ensureFavoritesCollection(db) {
  await db.transaction('rw', db.collections, async () => {
    if (await db.collections.get(FAVORITES_ID)) return;
    await db.collections.add({
      id: FAVORITES_ID,
      name: 'Favoriler',
      order: -1,
      createdAt: new Date().toISOString(),
      imageKeys: [],
      color: '#ff2d55',
    });
  });
}

export function addImagesToCollection(db, id, imageKeys) {
  return mutateCollectionKeys(db, id, (current) =>
    Array.from(new Set([...current, ...imageKeys]))
  );
}

export function removeImagesFromCollection(db, id, imageKeys) {
  const drop = new Set(imageKeys);
  return mutateCollectionKeys(db, id, (current) =>
    current.filter((k) => !drop.has(k))
  );
}
