import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Base UI / Floating UI jsdom'da ResizeObserver ister; stub yeterli.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Base UI Checkbox jsdom'da PointerEvent ister; stub yeterli.
if (typeof globalThis.PointerEvent === 'undefined') {
  const BaseClass = typeof MouseEvent !== 'undefined' ? MouseEvent : Event;
  class PointerEvent extends BaseClass {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);
      this.pointerId = eventInitDict.pointerId ?? 0;
      this.pointerType = eventInitDict.pointerType ?? 'mouse';
      this.isPrimary = eventInitDict.isPrimary ?? true;
      // MouseEvent's shiftKey/ctrlKey/altKey/metaKey are read-only getters;
      // base-ui checks these properties but doesn't set them, so no action needed.
    }
  }
  globalThis.PointerEvent = PointerEvent;
}

// Her test'ten sonra DOM'u temizle
afterEach(() => {
  cleanup();
});
