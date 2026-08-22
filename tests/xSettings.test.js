import { describe, it, expect, beforeEach } from 'vitest';
import {
  mergeConfig,
  saveXSettings,
  X_SETTINGS_KEY,
} from '../src/shared/xSettings.js';

const defaults = {
  bearerToken: 'DEFAULT_BEARER',
  bookmarksQueryId: 'DEF_BM',
  deleteBookmarkQueryId: 'DEF_DEL',
  bookmarksFeatures: { a: true },
};

describe('mergeConfig', () => {
  it('uses defaults when stored is empty', () => {
    expect(mergeConfig(defaults, {})).toEqual(defaults);
  });

  it('overrides with non-empty stored strings', () => {
    const r = mergeConfig(defaults, {
      bearerToken: 'USER_BEARER',
      bookmarksQueryId: '  QID  ',
    });
    expect(r.bearerToken).toBe('USER_BEARER');
    expect(r.bookmarksQueryId).toBe('QID'); // trimmed
    expect(r.deleteBookmarkQueryId).toBe('DEF_DEL'); // untouched
  });

  it('ignores empty / whitespace strings', () => {
    const r = mergeConfig(defaults, {
      bearerToken: '',
      bookmarksQueryId: '   ',
    });
    expect(r.bearerToken).toBe('DEFAULT_BEARER');
    expect(r.bookmarksQueryId).toBe('DEF_BM');
  });

  it('uses stored features object, ignores non-objects', () => {
    expect(
      mergeConfig(defaults, { bookmarksFeatures: { b: false } })
        .bookmarksFeatures
    ).toEqual({
      b: false,
    });
    expect(
      mergeConfig(defaults, { bookmarksFeatures: 'nope' }).bookmarksFeatures
    ).toEqual({
      a: true,
    });
    expect(
      mergeConfig(defaults, { bookmarksFeatures: ['x'] }).bookmarksFeatures
    ).toEqual({
      a: true,
    });
  });
});

function installChromeMock(initial = {}) {
  let store = { ...initial };
  globalThis.chrome = {
    storage: {
      local: {
        get: (key, cb) => cb({ [key]: store[key] }),
        set: (obj, cb) => {
          store = { ...store, ...obj };
          cb && cb();
        },
      },
    },
  };
  return () => store;
}

describe('saveXSettings undefined deletion', () => {
  it('removes a stored key when patched with undefined', async () => {
    const read = installChromeMock({
      [X_SETTINGS_KEY]: { bookmarksFeatures: { a: 1 }, bearerToken: 'T' },
    });
    await saveXSettings({ bookmarksFeatures: undefined });
    expect(read()[X_SETTINGS_KEY].bookmarksFeatures).toBeUndefined();
    expect(read()[X_SETTINGS_KEY].bearerToken).toBe('T');
  });
});
