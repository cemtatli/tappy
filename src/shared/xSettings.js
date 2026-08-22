export const X_SETTINGS_KEY = 'xSettings';

// Pure merge: a stored value wins only when it is meaningfully present.
// Strings: non-empty after trim. Features: a non-null plain object.
export function mergeConfig(defaults, stored = {}) {
  const pick = (key) => {
    const v = stored[key];
    return typeof v === 'string' && v.trim() !== '' ? v.trim() : defaults[key];
  };
  const features =
    stored.bookmarksFeatures &&
    typeof stored.bookmarksFeatures === 'object' &&
    !Array.isArray(stored.bookmarksFeatures)
      ? stored.bookmarksFeatures
      : defaults.bookmarksFeatures;
  return {
    bearerToken: pick('bearerToken'),
    bookmarksQueryId: pick('bookmarksQueryId'),
    deleteBookmarkQueryId: pick('deleteBookmarkQueryId'),
    bookmarksFeatures: features,
  };
}

export function loadXSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(X_SETTINGS_KEY, (result) => {
      resolve(result?.[X_SETTINGS_KEY] ?? {});
    });
  });
}

export function saveXSettings(patch) {
  return new Promise((resolve) => {
    chrome.storage.local.get(X_SETTINGS_KEY, (result) => {
      const next = { ...(result?.[X_SETTINGS_KEY] ?? {}), ...patch };
      for (const key of Object.keys(patch)) {
        if (patch[key] === undefined) delete next[key];
      }
      chrome.storage.local.set({ [X_SETTINGS_KEY]: next }, () => resolve(next));
    });
  });
}
