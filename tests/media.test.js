// tests/media.test.js
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  displayUrl,
  extFromUrl,
  copyImageToClipboard,
  downloadImage,
} from '../src/page/lib/media.js';

describe('displayUrl', () => {
  it('appends name=small to a pbs.twimg.com URL with no existing params', () => {
    const result = displayUrl('https://pbs.twimg.com/media/A.jpg', 'small');
    expect(result).toContain('name=small');
  });

  it('replaces existing name param on a pbs.twimg.com URL', () => {
    const result = displayUrl(
      'https://pbs.twimg.com/media/A.jpg?name=large',
      'small'
    );
    expect(result).toContain('name=small');
    expect(result).not.toContain('name=large');
  });

  it('preserves other query params and appends name correctly', () => {
    const result = displayUrl(
      'https://pbs.twimg.com/media/A.jpg?format=jpg',
      'small'
    );
    expect(result).toContain('format=jpg');
    expect(result).toContain('name=small');
  });

  it('returns non-twimg URLs unchanged', () => {
    const url = 'https://example.com/image.jpg';
    expect(displayUrl(url, 'small')).toBe(url);
  });

  it('defaults to small when no size argument is given', () => {
    const result = displayUrl('https://pbs.twimg.com/media/A.jpg');
    expect(result).toContain('name=small');
  });
});

describe('extFromUrl', () => {
  it('returns the path extension', () => {
    expect(extFromUrl('https://pbs.twimg.com/media/abc.jpg')).toBe('jpg');
  });

  it('prefers the format query parameter', () => {
    expect(
      extFromUrl('https://pbs.twimg.com/media/abc?format=png&name=large')
    ).toBe('png');
  });

  it('falls back to jpg when no extension is found', () => {
    expect(extFromUrl('https://pbs.twimg.com/media/abc')).toBe('jpg');
  });
});

describe('copyImageToClipboard', () => {
  let clipboardWrite;

  beforeEach(() => {
    clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { write: clipboardWrite },
      configurable: true,
    });
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(items) {
          this.items = items;
        }
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete navigator.clipboard;
  });

  it('writes a PNG blob directly to the clipboard', async () => {
    const pngBlob = new Blob(['png-data'], { type: 'image/png' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: async () => pngBlob })
    );

    await copyImageToClipboard('https://pbs.twimg.com/media/abc.png');

    expect(clipboardWrite).toHaveBeenCalledTimes(1);
    const item = clipboardWrite.mock.calls[0][0][0];
    expect(item.items['image/png']).toBe(pngBlob);
  });

  it('throws when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 403 })
    );

    await expect(
      copyImageToClipboard('https://pbs.twimg.com/media/abc.png')
    ).rejects.toThrow('HTTP 403');
    expect(clipboardWrite).not.toHaveBeenCalled();
  });
});

describe('downloadImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('downloads with a blob object URL and the correct filename', async () => {
    const jpgBlob = new Blob(['jpg-data'], { type: 'image/jpeg' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, blob: async () => jpgBlob })
    );
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();

    let clickedAnchor;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function click() {
        clickedAnchor = this;
      });

    await downloadImage('https://pbs.twimg.com/media/abc.jpg', 'tappy-1-1.jpg');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(clickedAnchor.download).toBe('tappy-1-1.jpg');
    expect(clickedAnchor.href).toContain('blob:mock-url');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('throws when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 })
    );

    await expect(
      downloadImage('https://pbs.twimg.com/media/abc.jpg', 'x.jpg')
    ).rejects.toThrow('HTTP 404');
  });
});
