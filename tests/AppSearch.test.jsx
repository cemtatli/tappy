import { describe, it, expect, vi } from 'vitest';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { App } from '../src/page/App.jsx';

vi.mock('../src/page/prefs.js', () => ({
  loadPrefs: () => ({
    sortMode: 'date-desc',
    view: 'canvas',
    source: 'all',
  }),
  savePrefs: vi.fn(),
}));
vi.mock('../src/shared/db.js', async (importOriginal) => ({
  ...(await importOriginal()),
  openDb: vi.fn().mockResolvedValue({}),
  ensureFavoritesCollection: vi.fn().mockResolvedValue(undefined),
  listCollections: vi
    .fn()
    .mockResolvedValue([
      { id: 'design', name: 'Design', imageKeys: ['1:0', '2:0'], order: 0 },
    ]),
  getAllTweets: vi.fn().mockResolvedValue([
    {
      id: '1',
      sortIndex: '2',
      authorHandle: 'alice',
      authorName: 'Alice',
      text: 'blue design',
      mediaUrls: ['alice-0.jpg', 'alice-1.jpg'],
      stats: { likes: 10 },
    },
    {
      id: '2',
      sortIndex: '1',
      authorHandle: 'bob',
      authorName: 'Bob',
      text: 'red design',
      mediaUrls: ['bob-0.jpg'],
      stats: { likes: 100 },
    },
  ]),
}));
vi.mock('../src/shared/messages.js', async (importOriginal) => ({
  ...(await importOriginal()),
  requestBookmarksPage: vi.fn().mockResolvedValue({ ok: true, data: {} }),
}));
// Observe what App passes to the canvas without coupling this test to layout.
vi.mock('../src/page/components/canvas/ImageCanvas.jsx', () => ({
  ImageCanvas: ({ images, focusRequest }) => (
    <div data-testid="canvas-results" data-focus={focusRequest?.imageKey}>
      {images.map((image) => image.url).join(',')}
    </div>
  ),
}));

describe('App search', () => {
  it('combines source, author, text and likes filters on the canvas, then resets', async () => {
    render(<App />);
    await screen.findByText('alice-0.jpg,bob-0.jpg,alice-1.jpg');

    fireEvent.click(screen.getByRole('button', { name: 'Filtreler' }));
    fireEvent.click(await screen.findByText('Design'));
    expect(screen.getByTestId('canvas-results').textContent).toBe(
      'alice-0.jpg,bob-0.jpg'
    );

    fireEvent.change(screen.getByLabelText('Ara'), {
      target: { value: 'design' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Daha fazla filtre' }));
    fireEvent.change(screen.getByLabelText('Yazar'), {
      target: { value: '@bob' },
    });
    fireEvent.change(screen.getByLabelText('Minimum beğeni'), {
      target: { value: '100' },
    });
    expect(screen.getByTestId('canvas-results').textContent).toBe('bob-0.jpg');
    expect(screen.getByRole('status').textContent).toContain('1 görsel');
    expect(screen.getByRole('status').textContent).toContain('Design');

    fireEvent.change(screen.getByLabelText('Minimum beğeni'), {
      target: { value: '101' },
    });
    expect(screen.getByTestId('canvas-results').textContent).toBe('');
    expect(screen.getByRole('status').textContent).toContain('0 görsel');

    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Filtreleri temizle',
      })
    );
    expect(screen.getByLabelText('Ara').value).toBe('');
    expect(screen.getByLabelText('Yazar').value).toBe('');
    expect(screen.getByTestId('canvas-results').textContent).toBe(
      'alice-0.jpg,bob-0.jpg'
    );
  });

  it('surprise me focuses a random image on the canvas', async () => {
    render(<App />);
    const results = await screen.findByTestId('canvas-results');
    fireEvent.click(screen.getByRole('button', { name: 'Şaşırt beni' }));
    await waitFor(() => {
      expect(results.dataset.focus).toMatch(/^(1:0|1:1|2:0)$/);
    });
  });
});
