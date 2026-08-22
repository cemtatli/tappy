// tests/MediaGrid.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaGrid } from '../src/page/components/MediaGrid.jsx';
import { copyImageToClipboard, downloadImage } from '../src/page/lib/media.js';

vi.mock('../src/page/lib/media.js', () => ({
  copyImageToClipboard: vi.fn(),
  downloadImage: vi.fn(),
  extFromUrl: vi.fn(() => 'jpg'),
  displayUrl: vi.fn((url) => url),
}));

const TWEET = {
  id: '1',
  authorName: 'Tappy',
  authorHandle: 'tappy',
  mediaUrls: ['https://pbs.twimg.com/a.jpg', 'https://pbs.twimg.com/b.jpg'],
};

describe('MediaGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no media items', () => {
    const { container } = render(
      <MediaGrid tweet={{ ...TWEET, mediaUrls: [] }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders all images and action buttons', () => {
    render(<MediaGrid tweet={TWEET} />);
    expect(document.querySelectorAll('img')).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Görseli panoya kopyala' })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('button', { name: 'Görseli indir' })
    ).toHaveLength(2);
  });

  it('copy button calls with the correct url and reports success', async () => {
    copyImageToClipboard.mockResolvedValue(undefined);
    const onStatus = vi.fn();
    render(<MediaGrid tweet={TWEET} onStatus={onStatus} />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Görseli panoya kopyala' })[1]
    );

    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith('Panoya kopyalandı.')
    );
    expect(copyImageToClipboard).toHaveBeenCalledWith(
      'https://pbs.twimg.com/b.jpg'
    );
  });

  it('reports an error status when copy fails', async () => {
    copyImageToClipboard.mockRejectedValue(new Error('HTTP 403'));
    const onStatus = vi.fn();
    render(<MediaGrid tweet={TWEET} onStatus={onStatus} />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Görseli panoya kopyala' })[0]
    );

    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith('Kopyalama başarısız: HTTP 403')
    );
  });

  it('download button uses handle-id-index.ext filename', async () => {
    downloadImage.mockResolvedValue(undefined);
    const onStatus = vi.fn();
    render(<MediaGrid tweet={TWEET} onStatus={onStatus} />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Görseli indir' })[1]
    );

    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith('Görsel indirildi.')
    );
    expect(downloadImage).toHaveBeenCalledWith(
      'https://pbs.twimg.com/b.jpg',
      'tappy-1-2.jpg'
    );
  });

  it('reports an error status when download fails', async () => {
    downloadImage.mockRejectedValue(new Error('HTTP 404'));
    const onStatus = vi.fn();
    render(<MediaGrid tweet={TWEET} onStatus={onStatus} />);

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Görseli indir' })[0]
    );

    await waitFor(() =>
      expect(onStatus).toHaveBeenCalledWith('İndirme başarısız: HTTP 404')
    );
  });
});
