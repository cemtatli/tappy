// Reads queryIds and the bearer token off the user's own GraphQL traffic.
// Unlike bundle scraping this does not depend on X's chunk URL or hash layout.

// The GraphQL host varies (x.com/i/api/graphql/... or api.x.com/graphql/...), so
// match on the path only. Requiring two segments excludes single-segment paths
// such as /1.1/graphql/viewer_context.
const GRAPHQL_URL_RE = /\/graphql\/([^/?]+)\/([A-Za-z0-9]+)/;

export function parseGraphqlUrl(url) {
  const m = url.match(GRAPHQL_URL_RE);
  return m ? { queryId: m[1], operationName: m[2] } : null;
}

export const OP_TO_FIELD = {
  Bookmarks: 'bookmarksQueryId',
  DeleteBookmark: 'deleteBookmarkQueryId',
};

// This chunk contains both the Bookmarks query and the DeleteBookmark mutation,
// so we can learn the delete queryId without the user ever deleting a bookmark.
export function isBookmarksChunkUrl(url) {
  return (
    /\/responsive-web\/client-web\//.test(url) &&
    url.endsWith('.js') &&
    url.includes('bundle.Bookmarks')
  );
}

export function bearerFromHeaders(headers) {
  if (!Array.isArray(headers)) return null;
  for (const h of headers) {
    if (h.name.toLowerCase() === 'authorization') {
      const m = /^Bearer\s+(.+)$/i.exec(h.value ?? '');
      if (m) return m[1].trim();
    }
  }
  return null;
}
