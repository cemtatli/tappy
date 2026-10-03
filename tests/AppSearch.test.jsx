import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { App } from '../src/page/App.jsx';

vi.mock('../src/page/prefs.js', () => ({
  loadPrefs: () => ({ sortMode: 'date-desc', viewMode: 'grid', source: 'all' }),
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
      text: 'blue design',
      mediaUrls: ['alice-0.jpg', 'alice-1.jpg'],
      stats: { likes: 10 },
    },
    {
      id: '2',
      sortIndex: '1',
      authorHandle: 'bob',
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
// Observe what App passes to each view, without coupling this test to virtualization.
vi.mock('../src/page/components/CardGrid.jsx', () => ({
  CardGrid: ({ tweets }) => (
    <div data-testid="grid-results">{tweets.map((t) => t.text).join(',')}</div>
  ),
}));
vi.mock('../src/page/components/canvas/ImageCanvas.jsx', () => ({
  ImageCanvas: ({ images }) => (
    <div data-testid="canvas-results">
      {images.map((image) => image.url).join(',')}
    </div>
  ),
}));

describe('App search', () => {
  it('combines author, text and likes filters across grid and collection canvas, then resets', async () => {
    render(<App />);
    await screen.findByText('blue design,red design');
    fireEvent.click(screen.getByText('Design'));
    fireEvent.click(screen.getByRole('button', { name: 'Gelişmiş arama' }));
    fireEvent.change(screen.getByLabelText('Ara'), {
      target: { value: 'design' },
    });
    fireEvent.change(screen.getByLabelText('Yazar'), {
      target: { value: '@bob' },
    });
    fireEvent.change(screen.getByLabelText('Minimum beğeni'), {
      target: { value: '100' },
    });
    expect(screen.getByTestId('grid-results').textContent).toBe('red design');
    fireEvent.click(screen.getByRole('button', { name: 'Canvas' }));
    expect(screen.getByTestId('canvas-results').textContent).toBe('bob-0.jpg');
    expect(screen.getByRole('status').textContent).toBe('1 görsel');
    fireEvent.change(screen.getByLabelText('Minimum beğeni'), {
      target: { value: '101' },
    });
    expect(screen.getByTestId('canvas-results').textContent).toBe('');
    expect(screen.getByRole('status').textContent).toBe('0 görsel');
    fireEvent.click(screen.getByRole('button', { name: 'Aramayı temizle' }));
    expect(screen.getByLabelText('Ara').value).toBe('');
    expect(screen.getByTestId('canvas-results').textContent).toBe(
      'alice-0.jpg,bob-0.jpg'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(screen.getByTestId('grid-results').textContent).toBe(
      'blue design,red design'
    );
  });
});
