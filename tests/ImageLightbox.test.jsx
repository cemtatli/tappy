import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageLightbox } from '../src/page/components/canvas/ImageLightbox.jsx';

const image1 = {
  imageKey: '1:0',
  url: 'https://pbs.twimg.com/a.jpg',
  tweetUrl: 'https://x.com/a/status/1',
  authorHandle: 'a',
  tweetId: '1',
  mediaIndex: 0,
};

const image2 = {
  imageKey: '1:1',
  url: 'https://pbs.twimg.com/b.jpg',
  tweetUrl: 'https://x.com/a/status/1',
  authorHandle: 'a',
  tweetId: '1',
  mediaIndex: 1,
};

describe('ImageLightbox', () => {
  it('renders the active image and closes via Kapat button', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox
        images={[image1]}
        initialKey="1:0"
        originRect={null}
        favoriteKeys={new Set()}
        onClose={onClose}
      />
    );
    expect(document.querySelector('img')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /kapat/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when images is empty', () => {
    const { container } = render(
      <ImageLightbox
        images={[]}
        initialKey={null}
        originRect={null}
        favoriteKeys={new Set()}
        onClose={() => {}}
      />
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('shows thumbnail strip and switches active image when clicked', () => {
    render(
      <ImageLightbox
        images={[image1, image2]}
        initialKey="1:0"
        originRect={null}
        favoriteKeys={new Set()}
        onClose={() => {}}
      />
    );

    // Two thumbnail buttons should be rendered.
    const thumb1 = screen.getByRole('button', { name: /görsel 1/i });
    const thumb2 = screen.getByRole('button', { name: /görsel 2/i });
    expect(thumb1).toBeTruthy();
    expect(thumb2).toBeTruthy();

    // Main image starts as image1.
    const mainImg = document.querySelector('[role="dialog"] img:not(.h-full)');
    expect(mainImg.src).toContain('a.jpg');

    // Click second thumbnail — main image should switch to image2.
    fireEvent.click(thumb2);
    expect(mainImg.src).toContain('b.jpg');
  });
});
