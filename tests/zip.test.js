import { describe, it, expect } from 'vitest';
import { buildZip } from '../src/page/lib/zip.js';

describe('buildZip', () => {
  it('produces a valid ZIP local file header signature', () => {
    const bytes = buildZip([
      { name: 'a.txt', bytes: new TextEncoder().encode('hi') },
    ]);
    // Local file header signature: 0x04034b50 little-endian => 50 4b 03 04
    expect(Array.from(bytes.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
    // End of central directory signature present near the end: 50 4b 05 06
    const tail = Array.from(bytes.slice(-22, -18));
    expect(tail).toEqual([0x50, 0x4b, 0x05, 0x06]);
  });

  it('embeds the file name', () => {
    const bytes = buildZip([{ name: 'hello.txt', bytes: new Uint8Array([1]) }]);
    const text = new TextDecoder('latin1').decode(bytes);
    expect(text).toContain('hello.txt');
  });
});
