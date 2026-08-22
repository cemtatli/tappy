import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ImageCanvas } from '../src/page/components/canvas/ImageCanvas.jsx';

const images = [
  {
    imageKey: '1:0',
    url: 'https://pbs.twimg.com/a.jpg',
    authorHandle: 'a',
    tweetUrl: 'u',
  },
  {
    imageKey: '1:1',
    url: 'https://pbs.twimg.com/b.jpg',
    authorHandle: 'a',
    tweetUrl: 'u',
  },
];

describe('ImageCanvas', () => {
  it('renders an img per visible image', () => {
    render(
      <ImageCanvas
        images={images}
        zoom={1}
        onZoomChange={vi.fn()}
        selectionMode={false}
        selectedIds={new Set()}
        onToggleSelect={vi.fn()}
      />
    );
    // alt="" gives role "presentation" in ARIA; query by tag instead
    const imgs = document.querySelectorAll('img');
    expect(imgs.length).toBeGreaterThanOrEqual(1);
  });
});
