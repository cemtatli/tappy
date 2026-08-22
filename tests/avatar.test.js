import { describe, it, expect } from 'vitest';
import { isUsableAvatar } from '../src/page/components/Avatar.jsx';

describe('isUsableAvatar', () => {
  it('accepts a real pbs.twimg avatar url', () => {
    expect(
      isUsableAvatar('https://pbs.twimg.com/profile_images/1/x_normal.jpg')
    ).toBe(true);
  });

  it('rejects the X default profile placeholder', () => {
    expect(
      isUsableAvatar(
        'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png'
      )
    ).toBe(false);
  });

  it('rejects null / empty', () => {
    expect(isUsableAvatar(null)).toBe(false);
    expect(isUsableAvatar('')).toBe(false);
  });
});
