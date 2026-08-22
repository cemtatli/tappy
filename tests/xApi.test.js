// tests/xApi.test.js
import { describe, it, expect, vi } from 'vitest';
import {
  buildBookmarksRequest,
  buildDeleteBookmarkRequest,
  createXApi,
} from '../src/background/xApi.js';

const authHeaders = { Authorization: 'Bearer X', 'x-csrf-token': 'CSRF' };
const config = {
  bearerToken: 'BEARER456',
  bookmarksQueryId: 'QID123',
  deleteBookmarkQueryId: 'DELQID456',
  bookmarksFeatures: { graphql_timeline_v2_bookmark_timeline: true },
};

describe('buildBookmarksRequest', () => {
  it('builds a GET request with cursor and headers', () => {
    const { url, options } = buildBookmarksRequest(
      'CUR123',
      authHeaders,
      config
    );
    expect(url).toBe(
      'https://x.com/i/api/graphql/QID123/Bookmarks?' +
        new URLSearchParams({
          variables: JSON.stringify({
            count: 20,
            cursor: 'CUR123',
            includePromotedContent: false,
          }),
          features: JSON.stringify(config.bookmarksFeatures),
        }).toString()
    );
    expect(options.method).toBe('GET');
    expect(options.headers).toBe(authHeaders);
    expect(options.credentials).toBe('include');
  });
});

describe('buildDeleteBookmarkRequest', () => {
  it('builds a POST request with tweet_id in body', () => {
    const { url, options } = buildDeleteBookmarkRequest(
      '999',
      authHeaders,
      config
    );
    expect(url).toBe('https://x.com/i/api/graphql/DELQID456/DeleteBookmark');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body).variables).toEqual({ tweet_id: '999' });
  });
});

function makeResponse({ ok, status, json, headers = {} }) {
  return {
    ok,
    status,
    headers: { get: (k) => headers[k] ?? null },
    json: async () => json,
  };
}

describe('createXApi', () => {
  it('throws NOT_LOGGED_IN when no session cookie', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: null, isLoggedIn: false });
    const api = createXApi({
      rateLimiter,
      getAuthCookies,
      config,
      fetchFn: vi.fn(),
    });

    await expect(api.fetchBookmarksPage()).rejects.toMatchObject({
      code: 'NOT_LOGGED_IN',
    });
  });

  it('fetchBookmarksPage returns parsed json on success', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: 'CSRF', isLoggedIn: true });
    const fetchFn = vi.fn(async () =>
      makeResponse({ ok: true, status: 200, json: { data: {} } })
    );
    const api = createXApi({ rateLimiter, getAuthCookies, config, fetchFn });

    await expect(api.fetchBookmarksPage()).resolves.toEqual({ data: {} });
  });

  it('fetchBookmarksPage throws with status on HTTP error', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: 'CSRF', isLoggedIn: true });
    const fetchFn = vi.fn(async () =>
      makeResponse({ ok: false, status: 500, json: {} })
    );
    const api = createXApi({ rateLimiter, getAuthCookies, config, fetchFn });

    await expect(api.fetchBookmarksPage()).rejects.toMatchObject({
      status: 500,
    });
  });

  it('deleteBookmark resolves on success', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: 'CSRF', isLoggedIn: true });
    const fetchFn = vi.fn(async () =>
      makeResponse({
        ok: true,
        status: 200,
        json: { data: { tweet_bookmark_delete: 'Done' } },
      })
    );
    const api = createXApi({ rateLimiter, getAuthCookies, config, fetchFn });

    await expect(api.deleteBookmark('1')).resolves.toEqual({
      data: { tweet_bookmark_delete: 'Done' },
    });
  });

  it('throws a clear config error when bookmarksQueryId is empty', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: 'CSRF', isLoggedIn: true });
    const unconfigured = {
      ...config,
      bookmarksQueryId: '',
    };
    const api = createXApi({
      rateLimiter,
      getAuthCookies,
      config: unconfigured,
      fetchFn: vi.fn(),
    });

    await expect(api.fetchBookmarksPage()).rejects.toThrow(/eksik/);
  });

  it('throws a clear config error when bearerToken is empty', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: 'CSRF', isLoggedIn: true });
    const unconfigured = {
      ...config,
      bearerToken: '',
    };
    const api = createXApi({
      rateLimiter,
      getAuthCookies,
      config: unconfigured,
      fetchFn: vi.fn(),
    });

    await expect(api.fetchBookmarksPage()).rejects.toThrow(/eksik/);
  });

  it('does not throw config error when all fields are populated', async () => {
    const rateLimiter = { enqueue: (fn) => fn() };
    const getAuthCookies = async () => ({ ct0: 'CSRF', isLoggedIn: true });
    const fetchFn = vi.fn(async () =>
      makeResponse({ ok: true, status: 200, json: { data: {} } })
    );
    const api = createXApi({ rateLimiter, getAuthCookies, config, fetchFn });

    await expect(api.fetchBookmarksPage()).resolves.toEqual({ data: {} });
  });
});
