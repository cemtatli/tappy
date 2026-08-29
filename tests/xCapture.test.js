import { describe, it, expect } from 'vitest';
import {
  parseGraphqlUrl,
  OP_TO_FIELD,
  isBookmarksChunkUrl,
  bearerFromHeaders,
  isTrustedInitiator,
  isValidQueryId,
  isValidBearerToken,
} from '../src/background/xCapture.js';

describe('parseGraphqlUrl', () => {
  it('parses queryId + operationName from a bookmarks request', () => {
    const url =
      'https://x.com/i/api/graphql/aBcD1234_efGH/Bookmarks?variables=%7B%7D';
    expect(parseGraphqlUrl(url)).toEqual({
      queryId: 'aBcD1234_efGH',
      operationName: 'Bookmarks',
    });
  });

  it('parses a DeleteBookmark request without query string', () => {
    const url = 'https://x.com/i/api/graphql/ZZ11yy22/DeleteBookmark';
    expect(parseGraphqlUrl(url)).toEqual({
      queryId: 'ZZ11yy22',
      operationName: 'DeleteBookmark',
    });
  });

  it('parses api.x.com host form (no /i/api prefix)', () => {
    const url = 'https://api.x.com/graphql/qId_9/Bookmarks?variables=%7B%7D';
    expect(parseGraphqlUrl(url)).toEqual({
      queryId: 'qId_9',
      operationName: 'Bookmarks',
    });
  });

  it('ignores single-segment graphql paths like viewer_context', () => {
    expect(
      parseGraphqlUrl('https://x.com/i/api/1.1/graphql/viewer_context')
    ).toBeNull();
  });

  it('returns null for non-graphql urls', () => {
    expect(parseGraphqlUrl('https://x.com/i/bookmarks')).toBeNull();
    expect(parseGraphqlUrl('https://abs.twimg.com/x.js')).toBeNull();
  });
});

describe('OP_TO_FIELD', () => {
  it('maps known operations to settings fields', () => {
    expect(OP_TO_FIELD.Bookmarks).toBe('bookmarksQueryId');
    expect(OP_TO_FIELD.DeleteBookmark).toBe('deleteBookmarkQueryId');
  });

  it('has no mapping for unrelated operations', () => {
    expect(OP_TO_FIELD.HomeTimeline).toBeUndefined();
  });
});

describe('isBookmarksChunkUrl', () => {
  it('matches the client-web Bookmarks bundle chunk', () => {
    expect(
      isBookmarksChunkUrl(
        'https://abs.twimg.com/responsive-web/client-web/shared~bundle.BookmarkFolders~bundle.Bookmarks.abc123.js'
      )
    ).toBe(true);
  });

  it('ignores other chunks', () => {
    expect(
      isBookmarksChunkUrl(
        'https://abs.twimg.com/responsive-web/client-web/main.210e4d1a.js'
      )
    ).toBe(false);
  });
});

describe('bearerFromHeaders', () => {
  it('extracts the token from an authorization header (case-insensitive)', () => {
    const headers = [
      { name: 'Authorization', value: 'Bearer AAAA_token_123' },
      { name: 'x-csrf-token', value: 'zzz' },
    ];
    expect(bearerFromHeaders(headers)).toBe('AAAA_token_123');
  });

  it('returns null when no bearer authorization present', () => {
    expect(bearerFromHeaders([{ name: 'accept', value: '*/*' }])).toBeNull();
    expect(bearerFromHeaders(undefined)).toBeNull();
  });
});

describe('isTrustedInitiator', () => {
  it('accepts requests initiated by x.com / twitter.com origins', () => {
    expect(isTrustedInitiator({ initiator: 'https://x.com' })).toBe(true);
    expect(isTrustedInitiator({ initiator: 'https://twitter.com' })).toBe(true);
  });

  it('rejects third-party, missing and non-https initiators', () => {
    expect(isTrustedInitiator({ initiator: 'https://evil.example' })).toBe(
      false
    );
    expect(isTrustedInitiator({ initiator: 'http://x.com' })).toBe(false);
    expect(isTrustedInitiator({})).toBe(false);
    expect(isTrustedInitiator(undefined)).toBe(false);
  });
});

describe('isValidQueryId / isValidBearerToken', () => {
  it('accepts well-formed values', () => {
    expect(isValidQueryId('QID123456789012345678')).toBe(true);
    expect(
      isValidBearerToken(
        'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D'
      )
    ).toBe(true);
  });

  it('rejects path-breaking or short values', () => {
    expect(isValidQueryId('../evil')).toBe(false);
    expect(isValidQueryId('short')).toBe(false);
    expect(isValidQueryId('a b c d e f g h i j k l m n o p')).toBe(false);
    expect(isValidBearerToken('with space token value here')).toBe(false);
    expect(isValidBearerToken('')).toBe(false);
  });
});
