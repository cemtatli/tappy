// Active X config discovery: scrapes the bearer token and the Bookmarks /
// DeleteBookmark queryIds out of x.com's HTML and client-web JS chunks.
// Called on demand from Settings and by the background self-heal path.
// The parsers are unit tested; the network orchestration is best-effort.

const BOOKMARKS_HTML_URL = 'https://x.com/i/bookmarks';
const SCRIPT_URL_RE =
  /https:\/\/abs\.twimg\.com\/responsive-web\/client-web\/[\w./-]+\.js/g;

// queryId: base64url-ish, ~22 chars.
const QUERY_ID = '[a-zA-Z0-9_-]{16,}';

function findQueryId(src, operationName) {
  // Either field order is possible; `[^}]` keeps the match inside one object
  // literal so we never pair a queryId with a different operation.
  const before = new RegExp(
    `queryId:"(${QUERY_ID})"[^}]{0,160}?operationName:"${operationName}"`
  );
  const after = new RegExp(
    `operationName:"${operationName}"[^}]{0,160}?queryId:"(${QUERY_ID})"`
  );
  const m = src.match(before) || src.match(after);
  return m ? m[1] : null;
}

export function parseXConfig(src) {
  const bearer = src.match(/"(AAAAAAAAAAAAAAAAAAAAA[A-Za-z0-9%]{40,})"/);
  return {
    bearerToken: bearer ? bearer[1] : null,
    bookmarksQueryId: findQueryId(src, 'Bookmarks'),
    deleteBookmarkQueryId: findQueryId(src, 'DeleteBookmark'),
  };
}

export function extractScriptUrls(text) {
  const seen = new Set();
  const out = [];
  for (const m of text.matchAll(SCRIPT_URL_RE)) {
    if (!seen.has(m[0])) {
      seen.add(m[0]);
      out.push(m[0]);
    }
  }
  return out;
}

// Only non-empty findings become a patch, so a missed field never clobbers a
// value already in storage.
export function mergeDiscovered(found) {
  const patch = {};
  if (found.bearerToken) patch.bearerToken = found.bearerToken;
  if (found.bookmarksQueryId) patch.bookmarksQueryId = found.bookmarksQueryId;
  if (found.deleteBookmarkQueryId)
    patch.deleteBookmarkQueryId = found.deleteBookmarkQueryId;
  return patch;
}

function complete(found) {
  return (
    found.bearerToken && found.bookmarksQueryId && found.deleteBookmarkQueryId
  );
}

// queryIds live in bundle.Bookmarks, the bearer in the main/shared bundle.
// Ordering the queue this way usually completes after 1-2 fetches instead of 60,
// which dominates discovery cost (~1MB download + regex per chunk).
export function chunkPriority(url) {
  if (url.includes('bundle.Bookmarks')) return 0;
  if (/\/(main|shared|vendor)[.~-]/.test(url)) return 1;
  return 2;
}

function byLikelihood(a, b) {
  return chunkPriority(a) - chunkPriority(b);
}

// Missing fields come back null; callers apply a partial patch via mergeDiscovered.
export async function discoverXConfig({
  fetchFn = fetch,
  htmlUrl = BOOKMARKS_HTML_URL,
  maxScripts = 60,
  maxQueue = 400,
} = {}) {
  const acc = {
    bearerToken: null,
    bookmarksQueryId: null,
    deleteBookmarkQueryId: null,
  };

  const absorb = (src) => {
    const f = parseXConfig(src);
    acc.bearerToken ||= f.bearerToken;
    acc.bookmarksQueryId ||= f.bookmarksQueryId;
    acc.deleteBookmarkQueryId ||= f.deleteBookmarkQueryId;
  };

  const getText = async (url) => {
    const res = await fetchFn(url, { credentials: 'include' });
    if (!res.ok) throw new Error(`fetch ${url} → ${res.status}`);
    return res.text();
  };

  const html = await getText(htmlUrl);
  absorb(html);

  const queue = extractScriptUrls(html).sort(byLikelihood);
  const visited = new Set();

  while (queue.length && visited.size < maxScripts && !complete(acc)) {
    const url = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    let src;
    try {
      src = await getText(url);
    } catch {
      continue; // one bad chunk must not abort discovery
    }
    absorb(src);
    // Follow chunk references found inside the chunk (ondemand manifest). The
    // queue is capped: X's manifest lists hundreds of chunks and queueing them
    // all costs memory plus a re-sort every round.
    let added = false;
    for (const next of extractScriptUrls(src)) {
      if (visited.has(next) || queue.length >= maxQueue) continue;
      queue.push(next);
      added = true;
    }
    if (added) queue.sort(byLikelihood);
  }

  return acc;
}
