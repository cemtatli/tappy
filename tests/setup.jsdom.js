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

// jsdom has no matchMedia; the canvas queries prefers-reduced-motion.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  });
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
