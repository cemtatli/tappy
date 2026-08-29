import { buildAuthHeaders } from './xAuth.js';

const GRAPHQL_BASE = 'https://x.com/i/api/graphql';

function assertConfigured(config) {
  if (
    !config.bearerToken ||
    !config.bookmarksQueryId ||
    !config.deleteBookmarkQueryId
  ) {
    const err = new Error(
      "X API değerleri eksik — Ayarlar ekranından Bearer token ve Query ID'lerini girin."
    );
    err.code = 'CONFIG_MISSING';
    throw err;
  }
}

export function buildBookmarksRequest(cursor, authHeaders, config) {
  const variables = {
    count: 20,
    cursor: cursor ?? undefined,
    includePromotedContent: false,
  };
  const params = new URLSearchParams({
    variables: JSON.stringify(variables),
    features: JSON.stringify(config.bookmarksFeatures),
  });
  return {
    url: `${GRAPHQL_BASE}/${encodeURIComponent(config.bookmarksQueryId)}/Bookmarks?${params.toString()}`,
    options: { method: 'GET', headers: authHeaders, credentials: 'include' },
  };
}

export function buildDeleteBookmarkRequest(tweetId, authHeaders, config) {
  return {
    url: `${GRAPHQL_BASE}/${encodeURIComponent(config.deleteBookmarkQueryId)}/DeleteBookmark`,
    options: {
      method: 'POST',
      headers: { ...authHeaders, 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        variables: { tweet_id: tweetId },
        queryId: config.deleteBookmarkQueryId,
      }),
    },
  };
}

function parseRateLimitHeaders(headers) {
  const remainingStr = headers.get('x-rate-limit-remaining');
  const resetStr = headers.get('x-rate-limit-reset');
  return {
    rateLimitRemaining: remainingStr === null ? null : Number(remainingStr),
    rateLimitResetEpochSeconds: resetStr === null ? null : Number(resetStr),
  };
}

export function createXApi({
  rateLimiter,
  getAuthCookies,
  config,
  fetchFn = fetch,
}) {
  async function ensureAuthHeaders() {
    const { ct0, isLoggedIn } = await getAuthCookies();
    if (!isLoggedIn) {
      const err = new Error('X oturumu bulunamadı');
      err.code = 'NOT_LOGGED_IN';
      throw err;
    }
    assertConfigured(config);
    return buildAuthHeaders({ ct0, bearerToken: config.bearerToken });
  }

  async function runRequest({ url, options }) {
    return rateLimiter.enqueue(async () => {
      const response = await fetchFn(url, options);
      const rl = parseRateLimitHeaders(response.headers);
      if (response.status === 429) {
        const err = new Error('X rate limited the request');
        err.status = 429;
        throw err;
      }
      return { response, ...rl };
    });
  }

  return {
    async fetchBookmarksPage(cursor) {
      const authHeaders = await ensureAuthHeaders();
      const { response } = await runRequest(
        buildBookmarksRequest(cursor, authHeaders, config)
      );
      if (!response.ok) {
        const err = new Error(`X isteği başarısız: ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return response.json();
    },

    async deleteBookmark(tweetId) {
      const authHeaders = await ensureAuthHeaders();
      const { response } = await runRequest(
        buildDeleteBookmarkRequest(tweetId, authHeaders, config)
      );
      if (!response.ok) {
        const err = new Error(`Unmark başarısız: ${response.status}`);
        err.status = response.status;
        throw err;
      }
      const json = await response.json();
      // X, GraphQL hatalarını HTTP 200 ile döndürebilir; bunu başarı sayarsak
      // yerel kayıt silinir ama bookmark X'te kalır.
      if (Array.isArray(json?.errors) && json.errors.length > 0) {
        const err = new Error(
          `Unmark başarısız: ${json.errors[0]?.message ?? 'GraphQL error'}`
        );
        err.code = 'GRAPHQL_ERROR';
        throw err;
      }
      return json;
    },
  };
}
