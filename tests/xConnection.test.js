import { describe, it, expect } from 'vitest';
import { connectionState, filledCount } from '../src/page/lib/xConnection.js';

const FULL = {
  bearerToken: 'AAAA',
  bookmarksQueryId: 'qid',
  deleteBookmarkQueryId: 'did',
};

describe('connectionState', () => {
  it('is loading while the login status is still unknown', () => {
    expect(connectionState({ isLoggedIn: null, ...FULL })).toBe('loading');
  });

  it('is logged-out when the user has no x.com session, even with every value filled', () => {
    expect(connectionState({ isLoggedIn: false, ...FULL })).toBe('logged-out');
  });

  it('is connected when logged in and all three values are present', () => {
    expect(connectionState({ isLoggedIn: true, ...FULL })).toBe('connected');
  });

  it('is incomplete when logged in but a value is missing', () => {
    expect(
      connectionState({ ...FULL, isLoggedIn: true, deleteBookmarkQueryId: '' })
    ).toBe('incomplete');
  });

  it('treats a whitespace-only value as missing', () => {
    expect(
      connectionState({ ...FULL, isLoggedIn: true, bookmarksQueryId: '   ' })
    ).toBe('incomplete');
  });

  it('treats an undefined value as missing', () => {
    expect(
      connectionState({
        isLoggedIn: true,
        bearerToken: 'AAAA',
        bookmarksQueryId: 'qid',
      })
    ).toBe('incomplete');
  });
});

describe('filledCount', () => {
  it('counts the values that are present', () => {
    expect(filledCount(FULL)).toBe(3);
    expect(filledCount({ ...FULL, bearerToken: '' })).toBe(2);
    expect(filledCount({})).toBe(0);
  });

  it('does not count whitespace-only values', () => {
    expect(filledCount({ ...FULL, bearerToken: '  ' })).toBe(2);
  });
});
