const CONFIG_FIELDS = [
  'bearerToken',
  'bookmarksQueryId',
  'deleteBookmarkQueryId',
];

function present(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function filledCount(config = {}) {
  return CONFIG_FIELDS.filter((f) => present(config[f])).length;
}

// A session is required before any config value matters, so a logged-out user
// is never reported as merely incomplete.
export function connectionState({ isLoggedIn, ...config }) {
  if (isLoggedIn === null || isLoggedIn === undefined) return 'loading';
  if (!isLoggedIn) return 'logged-out';
  return filledCount(config) === CONFIG_FIELDS.length
    ? 'connected'
    : 'incomplete';
}
