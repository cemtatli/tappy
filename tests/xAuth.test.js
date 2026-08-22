import { describe, it, expect } from 'vitest';
import { buildAuthHeaders } from '../src/background/xAuth.js';

describe('buildAuthHeaders', () => {
  it('builds expected headers from ct0 and bearerToken', () => {
    const headers = buildAuthHeaders({
      ct0: 'CSRF123',
      bearerToken: 'BEARER456',
    });
    expect(headers).toEqual({
      Authorization: 'Bearer BEARER456',
      'x-csrf-token': 'CSRF123',
      'x-twitter-active-user': 'yes',
      'x-twitter-auth-type': 'OAuth2Session',
    });
  });

  it('throws when ct0 is missing', () => {
    expect(() =>
      buildAuthHeaders({ ct0: null, bearerToken: 'BEARER456' })
    ).toThrow(/ct0/);
  });
});
