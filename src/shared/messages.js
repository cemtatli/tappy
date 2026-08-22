export const MESSAGE_TYPES = {
  REQUEST_BOOKMARKS_PAGE: 'REQUEST_BOOKMARKS_PAGE',
  REQUEST_DELETE_BOOKMARK: 'REQUEST_DELETE_BOOKMARK',
  GET_X_STATUS: 'GET_X_STATUS',
  DISCOVER_X_CONFIG: 'DISCOVER_X_CONFIG',
};

export function requestBookmarksPage(cursor) {
  return chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.REQUEST_BOOKMARKS_PAGE,
    cursor,
  });
}

export function requestDeleteBookmark(tweetId) {
  return chrome.runtime.sendMessage({
    type: MESSAGE_TYPES.REQUEST_DELETE_BOOKMARK,
    tweetId,
  });
}

export function requestXStatus() {
  return chrome.runtime.sendMessage({ type: MESSAGE_TYPES.GET_X_STATUS });
}

export function requestDiscoverXConfig() {
  return chrome.runtime.sendMessage({ type: MESSAGE_TYPES.DISCOVER_X_CONFIG });
}
