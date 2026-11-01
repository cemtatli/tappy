import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ImageGrid,
  gridMetrics,
} from '../src/page/components/canvas/ImageGrid.jsx';

const images = ['a', 'b', 'c'].map((id, i) => ({
  imageKey: `${id}:0`,
  tweetId: id,
  mediaIndex: 0,
  mediaCount: 1,
  url: `https://pbs.twimg.com/${id}.jpg`,
  authorHandle: id,
  authorName: id,
  text: `tweet ${id}`,
  likeCount: 0,
  bookmarkedAt: i === 0 ? '2026-11-01T11:16:19.362Z' : null,
}));

function renderGrid(props = {}) {
  return render(
    <ImageGrid
      images={images}
      selectionMode={false}
      selectedIds={new Set()}
      onToggleSelect={vi.fn()}
      onOpenLightbox={vi.fn()}
      focusRequest={null}
      viewKey="v"
      onLoadOlder={vi.fn()}
      {...props}
    />
  );
}

describe('gridMetrics', () => {
  it('fits as many columns as the width allows', () => {
    expect(gridMetrics(1440).columns).toBe(5);
    expect(gridMetrics(600).columns).toBe(2);
  });

  it('never drops below one column', () => {
    expect(gridMetrics(200).columns).toBe(1);
  });
});

describe('ImageGrid', () => {
  // The virtualizer reads the viewport from offsetHeight, which jsdom reports as 0.
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(800);
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000);
  });
  afterEach(() => vi.restoreAllMocks());

  it('keeps the given order', () => {
    renderGrid();
    const labels = screen
      .getAllByRole('button')
      .map((el) => el.getAttribute('aria-label'))
      .filter(Boolean);
    expect(labels).toEqual(['tweet a', 'tweet b', 'tweet c']);
  });

  it('shows the bookmark date only when it is known', () => {
    const { container } = renderGrid();
    const dates = container.querySelectorAll('time');
    expect(dates).toHaveLength(1);
    expect(dates[0].textContent).toContain('2026');
  });

  it('opens the lightbox on click', () => {
    const onOpenLightbox = vi.fn();
    renderGrid({ onOpenLightbox });
    fireEvent.click(screen.getByRole('button', { name: 'tweet b' }));
    expect(onOpenLightbox.mock.calls[0][0].imageKey).toBe('b:0');
  });

  it('loads older records only when asked', () => {
    const onLoadOlder = vi.fn();
    renderGrid({ onLoadOlder });
    expect(onLoadOlder).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Daha eski kayıtlar' }));
    expect(onLoadOlder).toHaveBeenCalledTimes(1);
  });
});
