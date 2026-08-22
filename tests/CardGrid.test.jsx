// tests/CardGrid.test.jsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CardGrid } from '../src/page/components/CardGrid.jsx';

const TWEETS = [
  {
    id: '1',
    authorName: 'A',
    authorHandle: 'a',
    text: 'bir',
    createdAt: '2026-07-01T10:00:00.000Z',
    mediaUrls: [],
    quoted: null,
    tweetUrl: 'https://x.com/a/status/1',
    avatarUrl: null,
    stats: { likes: 0, retweets: 0, replies: 0 },
  },
  {
    id: '2',
    authorName: 'B',
    authorHandle: 'b',
    text: 'iki',
    createdAt: '2026-07-02T10:00:00.000Z',
    mediaUrls: [],
    quoted: null,
    tweetUrl: 'https://x.com/b/status/2',
    avatarUrl: null,
    stats: { likes: 0, retweets: 0, replies: 0 },
  },
];

const BASE = {
  tweets: TWEETS,
  selectionMode: false,
  selectedIds: new Set(),
  onToggleSelect: () => {},
  onExportOne: () => {},
  onUnmarkOne: () => {},
  onLoadMore: () => {},
};

describe('CardGrid', () => {
  // jsdom does not compute layout; offsetWidth/offsetHeight always return 0.
  // @tanstack/react-virtual reads container size from those values — if they
  // stay 0 no rows are rendered. This stub is local to this file and is
  // restored after every test.
  let offH;
  let offW;

  beforeEach(() => {
    offH = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetHeight'
    );
    offW = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth'
    );
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      value: 800,
    });
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    if (offH)
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', offH);
    else delete HTMLElement.prototype.offsetHeight;
    if (offW) Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offW);
    else delete HTMLElement.prototype.offsetWidth;
  });

  it('renders tweets in the visible viewport in a single column', () => {
    render(<CardGrid {...BASE} />);
    const container = screen.getByTestId('card-container');
    expect(container).toBeTruthy();
    expect(container.className).toContain('max-w-[600px]');
    expect(screen.getByText('bir')).toBeTruthy();
  });

  it('triggers onLoadMore when rendering near the end of the list', () => {
    let called = false;
    render(
      <CardGrid
        {...BASE}
        onLoadMore={() => {
          called = true;
        }}
      />
    );
    expect(screen.getByTestId('card-container')).toBeTruthy();
    expect(called).toBe(true);
  });

  it('shows quick-scroll buttons when list is populated and scrolls on click', () => {
    // jsdom does not implement Element.scrollTo; stub so the virtualizer can call it.
    const scrollTo = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    try {
      render(<CardGrid {...BASE} />);
      fireEvent.click(screen.getByRole('button', { name: 'En üste git' }));
      fireEvent.click(screen.getByRole('button', { name: 'En alta git' }));
      expect(scrollTo).toHaveBeenCalled();
    } finally {
      delete HTMLElement.prototype.scrollTo;
    }
  });

  it('hides quick-scroll buttons when the list is empty', () => {
    render(<CardGrid {...BASE} tweets={[]} />);
    expect(screen.queryByRole('button', { name: 'En üste git' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'En alta git' })).toBeNull();
  });

  it('marks a row as exiting so its unmark animation can play', () => {
    render(
      <CardGrid
        tweets={TWEETS}
        selectionMode={false}
        selectedIds={new Set()}
        exitingIds={new Set(['1'])}
        onToggleSelect={() => {}}
      />
    );
    const row = document
      .querySelector('[data-tweet-id="1"]')
      .closest('[data-index]');
    expect(row.className).toContain('card-exit');
  });

  it('leaves rows that are not being unmarked alone', () => {
    render(
      <CardGrid
        tweets={TWEETS}
        selectionMode={false}
        selectedIds={new Set()}
        exitingIds={new Set(['1'])}
        onToggleSelect={() => {}}
      />
    );
    const row = document
      .querySelector('[data-tweet-id="2"]')
      .closest('[data-index]');
    expect(row.className).not.toContain('card-exit');
  });
});
