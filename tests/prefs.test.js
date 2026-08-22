import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadPrefs, savePrefs } from '../src/page/prefs.js';

function makeStorageMock() {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('prefs', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', makeStorageMock());
    localStorage.clear();
  });

  it('returns defaults when storage is empty', () => {
    expect(loadPrefs()).toEqual({
      sortMode: 'date-desc',
      viewMode: 'grid',
      source: 'all',
    });
  });

  it('restores a saved preference', () => {
    savePrefs({ sortMode: 'likes-desc' });
    expect(loadPrefs().sortMode).toBe('likes-desc');
  });

  it('falls back to default for invalid value, does not crash on malformed JSON', () => {
    localStorage.setItem(
      'x-bookmarker:prefs',
      JSON.stringify({ sortMode: 'yok' })
    );
    expect(loadPrefs().sortMode).toBe('date-desc');
    localStorage.setItem('x-bookmarker:prefs', '{bozuk');
    expect(loadPrefs().sortMode).toBe('date-desc');
  });

  it('viewMode default is grid', () => {
    expect(loadPrefs().viewMode).toBe('grid');
  });

  it('saves and restores viewMode', () => {
    savePrefs({ viewMode: 'canvas' });
    expect(loadPrefs().viewMode).toBe('canvas');
  });

  it('source default is all', () => {
    expect(loadPrefs().source).toBe('all');
  });

  it('saves and restores source', () => {
    savePrefs({ source: 'images' });
    expect(loadPrefs().source).toBe('images');
  });
});
