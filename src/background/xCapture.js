// Reads queryIds and the bearer token off the user's own GraphQL traffic.
// Unlike bundle scraping this does not depend on X's chunk URL or hash layout.

// The GraphQL host varies (x.com/i/api/graphql/... or api.x.com/graphql/...), so
// match on the path only. Requiring two segments excludes single-segment paths
// such as /1.1/graphql/viewer_context.
const GRAPHQL_URL_RE = /\/graphql\/([^/?]+)\/([A-Za-z0-9]+)/;

// webRequest listener'ları URL'ye göre filtreler; initiator'ı biz kontrol etmezsek
// herhangi bir site <img src="https://x.com/i/api/graphql/EVIL/DeleteBookmark">
// ile yakalanan queryId'yi zehirleyebilir. Yalnızca X'in kendi origin'lerinden
// gelen istekler güvenilir.
const TRUSTED_INITIATORS = new Set([
  'https://x.com',
  'https://www.x.com',
  'https://mobile.x.com',
  'https://twitter.com',
  'https://www.twitter.com',
  'https://mobile.twitter.com',
]);

// X persisted-query id'leri URL-safe base64 benzeri kısa string'ler.
const QUERY_ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
// Bearer token base64/URL-encoded; boşluk veya path karakteri içermez.
const BEARER_RE = /^[A-Za-z0-9%+/=_-]{20,}$/;

export function isTrustedInitiator(details) {
  const origin = details?.initiator;
  return typeof origin === 'string' && TRUSTED_INITIATORS.has(origin);
}

export function isValidQueryId(value) {
  return typeof value === 'string' && QUERY_ID_RE.test(value);
}

export function isValidBearerToken(value) {
  return typeof value === 'string' && BEARER_RE.test(value);
}

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
