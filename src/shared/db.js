export const FAVORITES_ID = '__favorites__';
const DB_NAME = 'x-bookmarker';
const DB_VERSION = 3;
const TWEETS_STORE = 'tweets';
const META_STORE = 'meta';
const CATEGORIES_STORE = 'categories';
const COLLECTIONS_STORE = 'collections';

export function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(TWEETS_STORE)) {
        const store = db.createObjectStore(TWEETS_STORE, { keyPath: 'id' });
        store.createIndex('sortIndex', 'sortIndex');
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(CATEGORIES_STORE)) {
        db.createObjectStore(CATEGORIES_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(COLLECTIONS_STORE)) {
        db.createObjectStore(COLLECTIONS_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function putTweets(db, tweets) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TWEETS_STORE, 'readwrite');
    const store = tx.objectStore(TWEETS_STORE);
    for (const tweet of tweets) store.put(tweet);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function getAllTweets(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TWEETS_STORE, 'readonly');
    const request = tx.objectStore(TWEETS_STORE).getAll();
    request.onsuccess = () => {
      const tweets = request.result.slice().sort((a, b) => {
        const diff = BigInt(b.sortIndex) - BigInt(a.sortIndex);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });
      resolve(tweets);
    };
    request.onerror = () => reject(request.error);
  });
}

export function deleteTweetById(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TWEETS_STORE, 'readwrite');
    tx.objectStore(TWEETS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function getMeta(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const request = tx.objectStore(META_STORE).get(key);
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}

export function setMeta(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function listCategories(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE, 'readonly');
    const request = tx.objectStore(CATEGORIES_STORE).getAll();
    request.onsuccess = () => {
      const cats = request.result
        .slice()
        .sort(
          (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)
        );
      resolve(cats);
    };
    request.onerror = () => reject(request.error);
  });
}

export function putCategory(db, category) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CATEGORIES_STORE, 'readwrite');
    tx.objectStore(CATEGORIES_STORE).put(category);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function deleteCategory(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction([CATEGORIES_STORE, TWEETS_STORE], 'readwrite');
    tx.objectStore(CATEGORIES_STORE).delete(id);
    const tweetsStore = tx.objectStore(TWEETS_STORE);
    const cursorRequest = tweetsStore.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if (cursor.value.categoryId === id) {
        cursor.update({ ...cursor.value, categoryId: null });
      }
      cursor.continue();
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function setTweetCategory(db, ids, categoryId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TWEETS_STORE, 'readwrite');
    const store = tx.objectStore(TWEETS_STORE);
    for (const id of ids) {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          store.put({ ...getRequest.result, categoryId });
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function listCollections(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COLLECTIONS_STORE, 'readonly');
    const request = tx.objectStore(COLLECTIONS_STORE).getAll();
    request.onsuccess = () => {
      const cols = request.result
        .slice()
        .sort(
          (a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt)
        );
      resolve(cols);
    };
    request.onerror = () => reject(request.error);
  });
}

export function putCollection(db, collection) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
    tx.objectStore(COLLECTIONS_STORE).put(collection);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function deleteCollection(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
    tx.objectStore(COLLECTIONS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function mutateCollectionKeys(db, id, mutate) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
    const store = tx.objectStore(COLLECTIONS_STORE);
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const collection = getRequest.result;
      if (collection) {
        collection.imageKeys = mutate(collection.imageKeys ?? []);
        store.put(collection);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function ensureFavoritesCollection(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COLLECTIONS_STORE, 'readwrite');
    const store = tx.objectStore(COLLECTIONS_STORE);
    const getRequest = store.get(FAVORITES_ID);
    getRequest.onsuccess = () => {
      if (!getRequest.result) {
        store.put({
          id: FAVORITES_ID,
          name: 'Favoriler',
          order: -1,
          createdAt: new Date().toISOString(),
          imageKeys: [],
          color: '#ff2d55',
        });
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
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
