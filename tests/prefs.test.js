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
      view: 'canvas',
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

  it('opens on the canvas by default', () => {
    expect(loadPrefs().view).toBe('canvas');
  });

  it('ignores the retired viewMode value older versions stored', () => {
    localStorage.setItem(
      'x-bookmarker:prefs',
      JSON.stringify({ viewMode: 'grid' })
    );
    expect(loadPrefs().view).toBe('canvas');
  });

  it('saves and restores view', () => {
    savePrefs({ view: 'grid' });
    expect(loadPrefs().view).toBe('grid');
  });

  it('source default is all', () => {
    expect(loadPrefs().source).toBe('all');
  });

  it('saves and restores source', () => {
    savePrefs({ source: 'images' });
    expect(loadPrefs().source).toBe('images');
  });
});
