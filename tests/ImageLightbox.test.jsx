import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

afterEach(() => vi.useRealTimers());

describe('ImageLightbox', () => {
  it('renders the active image and closes via Kapat button', () => {
    vi.useFakeTimers();
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
    act(() => vi.advanceTimersByTime(400));
    expect(onClose).toHaveBeenCalled();
  });

  it('plays its exit before telling the parent to close', () => {
    vi.useFakeTimers();
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
    fireEvent.click(screen.getByRole('button', { name: /kapat/i }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog').getAttribute('data-closing')).toBe(
      'true'
    );
    act(() => vi.advanceTimersByTime(400));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not fire a second close when Kapat is pressed twice', () => {
    vi.useFakeTimers();
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
    const close = screen.getByRole('button', { name: /kapat/i });
    fireEvent.click(close);
    fireEvent.click(close);
    act(() => vi.advanceTimersByTime(400));
    expect(onClose).toHaveBeenCalledTimes(1);
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
    // The main image remounts per frame so it can crossfade; re-query it.
    const mainImg = () =>
      document.querySelector('[role="dialog"] img.lightbox-image');
    expect(mainImg().src).toContain('a.jpg');

    // Click second thumbnail — main image should switch to image2.
    fireEvent.click(thumb2);
    expect(mainImg().src).toContain('b.jpg');
  });

  it('reopens fully visible after a previous close', () => {
    vi.useFakeTimers();
    const props = {
      initialKey: '1:0',
      originRect: null,
      favoriteKeys: new Set(),
      onClose: () => {},
    };
    const { rerender } = render(<ImageLightbox {...props} images={[image1]} />);
    fireEvent.click(screen.getByRole('button', { name: /kapat/i }));
    act(() => vi.advanceTimersByTime(400));

    // The parent clears the selection, then the user opens another image.
    rerender(<ImageLightbox {...props} images={[]} initialKey={null} />);
    rerender(<ImageLightbox {...props} images={[image1]} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('data-closing')).toBeNull();
    expect(dialog.className).toContain('opacity-100');
    expect(dialog.querySelector('[class*="lightbox-out"]')).toBeNull();
  });

  it('reserves no space when the preview panel is closed', () => {
    render(
      <ImageLightbox
        images={[image1]}
        initialKey="1:0"
        originRect={null}
        favoriteKeys={new Set()}
        onClose={() => {}}
      />
    );
    const stage = screen.getByTestId('lightbox-stage');
    expect(stage.style.paddingRight).toBe('0px');
  });

  it('shrinks and shifts left to clear the preview panel', () => {
    render(
      <ImageLightbox
        images={[image1]}
        initialKey="1:0"
        originRect={null}
        favoriteKeys={new Set()}
        reservedRight={420}
        onClose={() => {}}
      />
    );
    const stage = screen.getByTestId('lightbox-stage');
    expect(stage.style.paddingRight).toBe('420px');

    const mainImg = document.querySelector(
      '[role="dialog"] img.lightbox-image'
    );
    expect(mainImg.style.maxWidth).toContain('420px');
  });
});

describe('ImageLightbox loading', () => {
  function renderOne() {
    render(
      <ImageLightbox
        images={[image1, image2]}
        initialKey="1:0"
        originRect={null}
        favoriteKeys={new Set()}
        onClose={() => {}}
      />
    );
  }

  it('paints the small variant at the full image size while the full one loads', () => {
    renderOne();
    const preview = screen.getByTestId('lightbox-preview');
    expect(preview.src).toContain('name=small');
    Object.defineProperty(preview, 'naturalWidth', { value: 510 });
    Object.defineProperty(preview, 'naturalHeight', { value: 680 });
    fireEvent.load(preview);
    expect(preview.style.width).toContain('900px');
    expect(document.querySelector('img.lightbox-image').className).toContain(
      'hidden'
    );
  });

  it('swaps to the full image without replaying the entrance', () => {
    renderOne();
    const preview = screen.getByTestId('lightbox-preview');
    fireEvent.load(preview);
    const full = document.querySelector('img.lightbox-image');
    fireEvent.load(full);
    expect(screen.queryByTestId('lightbox-preview')).toBeNull();
    expect(full.className).not.toContain('hidden');
    expect(full.className).toContain('lightbox-image--swapped');
  });

  it('requests small thumbnails for the strip, not the full images', () => {
    renderOne();
    const strip = screen.getByRole('button', { name: 'Görsel 2' });
    expect(strip.querySelector('img').src).toContain('name=240x240');
  });
});
