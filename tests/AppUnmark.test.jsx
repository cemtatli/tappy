import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { App } from '../src/page/App.jsx';
import { requestDeleteBookmark } from '../src/shared/messages.js';
import { deleteTweetById } from '../src/shared/db.js';
import { savePrefs } from '../src/page/prefs.js';

vi.mock('../src/page/prefs.js', () => ({
  loadPrefs: () => ({ sortMode: 'date-desc', view: 'canvas', source: 'all' }),
  savePrefs: vi.fn(),
}));
vi.mock('../src/shared/db.js', async (importOriginal) => {
  const tweet = {
    id: '1',
    sortIndex: '2',
    authorHandle: 'alice',
    authorName: 'Alice',
    text: 'blue design',
    mediaUrls: ['https://pbs.twimg.com/alice.jpg'],
    tweetUrl: 'https://x.com/alice/status/1',
    stats: { likes: 10 },
  };
  return {
    ...(await importOriginal()),
    openDb: vi.fn().mockResolvedValue({}),
    ensureFavoritesCollection: vi.fn().mockResolvedValue(undefined),
    listCollections: vi.fn().mockResolvedValue([]),
    getAllTweets: vi.fn().mockResolvedValue([tweet]),
    deleteTweetById: vi.fn().mockResolvedValue(undefined),
  };
});
vi.mock('../src/shared/messages.js', async (importOriginal) => ({
  ...(await importOriginal()),
  requestBookmarksPage: vi.fn().mockResolvedValue({ ok: true, data: {} }),
  requestDeleteBookmark: vi.fn().mockResolvedValue({ ok: true }),
}));
vi.mock('../src/page/components/canvas/ImageCanvas.jsx', () => ({
  ImageCanvas: ({ images, onOpenLightbox }) => (
    <div data-testid="canvas">
      {images.map((image) => (
        <button
          key={image.imageKey}
          type="button"
          onClick={() => onOpenLightbox(image, null)}
        >
          {`open ${image.tweetId}`}
        </button>
      ))}
    </div>
  ),
}));

const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

async function openLightbox() {
  render(<App />);
  await flush();
  fireEvent.click(screen.getByRole('button', { name: 'open 1' }));
}

function unmark() {
  fireEvent.click(screen.getByRole('button', { name: 'Unmark' }));
}

describe('App unmark and lightbox preview', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('opens the X embed together with the lightbox', async () => {
    await openLightbox();
    expect(screen.getByTitle('Tweet önizleme').src).toContain('id=1');
  });

  it('closes the embed when the lightbox closes', async () => {
    await openLightbox();
    fireEvent.click(screen.getByRole('button', { name: 'Kapat' }));
    await act(() => vi.advanceTimersByTimeAsync(400));
    expect(screen.queryByTitle('Tweet önizleme')).toBeNull();
  });

  it('removes without a dialog and calls X only after the undo window', async () => {
    await openLightbox();
    unmark();
    expect(screen.queryByRole('alertdialog')).toBeNull();
    expect(screen.queryByRole('button', { name: 'open 1' })).toBeNull();

    await act(() => vi.advanceTimersByTimeAsync(4999));
    expect(requestDeleteBookmark).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(requestDeleteBookmark).toHaveBeenCalledWith('1');
    expect(deleteTweetById).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Geri al' })).toBeNull();
  });

  it('undo restores the bookmark, never calls X, and keeps the panel closed', async () => {
    await openLightbox();
    unmark();
    fireEvent.click(screen.getByRole('button', { name: 'Geri al' }));
    await flush();

    expect(screen.getByRole('button', { name: 'open 1' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Geri al' })).toBeNull();
    expect(screen.queryByTitle('Tweet önizleme')).toBeNull();

    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(requestDeleteBookmark).not.toHaveBeenCalled();
  });

  it('restores the bookmark when X refuses the removal', async () => {
    requestDeleteBookmark.mockResolvedValueOnce({
      ok: false,
      error: { message: 'nope' },
    });
    await openLightbox();
    unmark();
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(deleteTweetById).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'open 1' })).toBeTruthy();
    expect(screen.getByText(/Unmark başarısız/)).toBeTruthy();
  });

  it('switches to the grid and remembers it', async () => {
    render(<App />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: 'Izgaraya geç' }));
    expect(screen.getByTestId('image-grid')).toBeTruthy();
    expect(screen.queryByTestId('canvas')).toBeNull();
    expect(savePrefs).toHaveBeenCalledWith({ view: 'grid' });
    fireEvent.click(screen.getByRole('button', { name: 'Sonsuz tuvale geç' }));
    expect(screen.getByTestId('canvas')).toBeTruthy();
  });
});
