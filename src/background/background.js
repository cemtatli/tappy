import { RateLimitedQueue, withBackoffRetry } from './rateLimiter.js';
import { getAuthCookies } from './xAuth.js';
import { createXApi } from './xApi.js';
import { MESSAGE_TYPES } from '../shared/messages.js';
import {
  mergeConfig,
  loadXSettings,
  saveXSettings,
} from '../shared/xSettings.js';
import { discoverXConfig, mergeDiscovered, parseXConfig } from './xDiscover.js';
import {
  parseGraphqlUrl,
  OP_TO_FIELD,
  isBookmarksChunkUrl,
  bearerFromHeaders,
} from './xCapture.js';
import {
  PUBLIC_BEARER_TOKEN,
  BOOKMARKS_QUERY_ID,
  DELETE_BOOKMARK_QUERY_ID,
  BOOKMARKS_FEATURES,
} from './xConfig.js';

const rateLimiter = new RateLimitedQueue();

const DEFAULT_CONFIG = {
  bearerToken: PUBLIC_BEARER_TOKEN,
  bookmarksQueryId: BOOKMARKS_QUERY_ID,
  deleteBookmarkQueryId: DELETE_BOOKMARK_QUERY_ID,
  bookmarksFeatures: BOOKMARKS_FEATURES,
};

async function buildXApi() {
  const stored = await loadXSettings();
  const config = mergeConfig(DEFAULT_CONFIG, stored);
  return createXApi({ rateLimiter, getAuthCookies, config });
}

// Self-heal: on 401/404, rediscover the X config, persist it and retry once.
// `op` must build a fresh xApi per call so the retry picks up the new config.
async function withAuthHeal(op) {
  try {
    return await op();
  } catch (err) {
    const healable =
      err?.status === 401 ||
      err?.status === 404 ||
      err?.code === 'CONFIG_MISSING';
    if (!healable) throw err;
    const found = await discoverXConfig().catch(() => null);
    const patch = found ? mergeDiscovered(found) : {};
    if (Object.keys(patch).length === 0) throw err;
    await saveXSettings(patch);
    resetCapture(patch);
    return op();
  }
}

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MESSAGE_TYPES.REQUEST_BOOKMARKS_PAGE) {
    withAuthHeal(() =>
      buildXApi().then((xApi) =>
        withBackoffRetry(() => xApi.fetchBookmarksPage(message.cursor))
      )
    )
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: serializeError(err) }));
    return true;
  }

  if (message.type === MESSAGE_TYPES.REQUEST_DELETE_BOOKMARK) {
    withAuthHeal(() =>
      buildXApi().then((xApi) =>
        withBackoffRetry(() => xApi.deleteBookmark(message.tweetId))
      )
    )
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: serializeError(err) }));
    return true;
  }

  if (message.type === MESSAGE_TYPES.DISCOVER_X_CONFIG) {
    discoverXConfig()
      .then(async (found) => {
        const patch = mergeDiscovered(found);
        if (Object.keys(patch).length) await saveXSettings(patch);
        return { found, patch };
      })
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: serializeError(err) }));
    return true;
  }

  if (message.type === MESSAGE_TYPES.GET_X_STATUS) {
    getAuthCookies()
      .then(({ isLoggedIn }) =>
        sendResponse({ ok: true, data: { isLoggedIn } })
      )
      .catch((err) => sendResponse({ ok: false, error: serializeError(err) }));
    return true;
  }

  return false;
});

function serializeError(err) {
  return { message: err.message, code: err.code, status: err.status };
}

// Passive capture: harvest queryIds and the bearer token from the user's own
// x.com traffic. Listeners stay attached ONLY while the config is incomplete —
// an attached webRequest listener routes every matching request through the
// extension, which is a constant CPU cost while browsing x.com. Once all three
// fields are known we detach entirely; withAuthHeal reattaches if they go stale.
const CAPTURE_FIELDS = [
  'bearerToken',
  'bookmarksQueryId',
  'deleteBookmarkQueryId',
];

const GRAPHQL_URLS = [
  'https://x.com/i/api/graphql/*',
  'https://api.x.com/graphql/*',
];

const captured = {};

// Fetch the Bookmarks bundle at most once. Gating on captured.deleteBookmarkQueryId
// would leave the guard open forever when parsing fails, refetching on every
// bundle request. Set before the fetch starts so concurrent requests can't herd.
let bookmarksChunkTried = false;
let captureAttached = false;

function captureComplete() {
  return CAPTURE_FIELDS.every((f) => captured[f]);
}

async function captureField(field, value) {
  if (!value || captured[field] === value) return;
  captured[field] = value;
  await saveXSettings({ [field]: value });
  if (captureComplete()) detachCapture();
}

function onBeforeRequest(details) {
  const g = parseGraphqlUrl(details.url);
  if (g && OP_TO_FIELD[g.operationName]) {
    captureField(OP_TO_FIELD[g.operationName], g.queryId);
    return;
  }
  // The Bookmarks bundle carries both queryIds, so one fetch yields both.
  if (isBookmarksChunkUrl(details.url) && !bookmarksChunkTried) {
    bookmarksChunkTried = true;
    fetch(details.url)
      .then((r) => (r.ok ? r.text() : ''))
      .then((src) => {
        const f = parseXConfig(src);
        captureField('bookmarksQueryId', f.bookmarksQueryId);
        captureField('deleteBookmarkQueryId', f.deleteBookmarkQueryId);
      })
      .catch(() => {});
  }
}

function onBeforeSendHeaders(details) {
  // Synchronous bail-out: skip the header scan and promise allocation per request.
  if (captured.bearerToken) return;
  const tok = bearerFromHeaders(details.requestHeaders);
  if (tok) captureField('bearerToken', tok);
}

function attachCapture() {
  if (captureAttached) return;
  if (typeof chrome === 'undefined' || !chrome.webRequest) return;
  captureAttached = true;
  chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
    urls: [
      ...GRAPHQL_URLS,
      'https://abs.twimg.com/responsive-web/client-web/*',
    ],
  });
  // No 'extraHeaders' on purpose: Authorization is not one of the headers the
  // network service withholds by default, and extraHeaders would drop matching
  // requests off the fast path.
  chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeaders,
    { urls: GRAPHQL_URLS },
    ['requestHeaders']
  );
}

function detachCapture() {
  if (!captureAttached) return;
  captureAttached = false;
  chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequest);
  chrome.webRequest.onBeforeSendHeaders.removeListener(onBeforeSendHeaders);
}

// Config went stale: adopt the rediscovered values and reattach passive capture
// if anything is still missing, so we avoid the expensive chunk scan next time.
function resetCapture(patch) {
  bookmarksChunkTried = false;
  for (const field of CAPTURE_FIELDS) {
    if (patch[field]) captured[field] = patch[field];
    else delete captured[field];
  }
  if (!captureComplete()) attachCapture();
}

// The MV3 service worker restarts often; rehydrate from storage on every wake-up
// so a complete config never reattaches the listeners.
async function initCapture() {
  const stored = await loadXSettings().catch(() => ({}));
  for (const field of CAPTURE_FIELDS) {
    const v = stored?.[field];
    if (typeof v === 'string' && v.trim()) captured[field] = v.trim();
  }
  if (!captureComplete()) attachCapture();
}

initCapture();
