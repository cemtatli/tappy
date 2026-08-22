// tests/Card.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../src/page/components/Card.jsx';

const TWEET = {
  id: '1',
  authorName: 'Tappy',
  authorHandle: 'tappy',
  text: 'merhaba dünya',
  createdAt: '2026-07-01T10:00:00.000Z',
  mediaUrls: [],
  tweetUrl: 'https://x.com/tappy/status/1',
  avatarUrl: null,
  quoted: null,
  stats: { likes: 2, retweets: 1, replies: 0 },
};

describe('Card', () => {
  it('shows author name, handle, text and short date', () => {
    render(<Card tweet={TWEET} />);
    expect(screen.getByText('Tappy')).toBeTruthy();
    expect(screen.getByText('@tappy')).toBeTruthy();
    expect(screen.getByText('merhaba dünya')).toBeTruthy();
    expect(screen.getByText(/1 Tem 2026/)).toBeTruthy();
  });

  it('renders text with HTML as plain text (XSS)', () => {
    render(<Card tweet={{ ...TWEET, text: '<img src=x onerror=alert(1)>' }} />);
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeTruthy();
    expect(document.querySelector('img[src="x"]')).toBeNull();
  });

  it('calls action callbacks with the correct id', () => {
    const onExportOne = vi.fn();
    const onUnmarkOne = vi.fn();
    render(
      <Card tweet={TWEET} onExportOne={onExportOne} onUnmarkOne={onUnmarkOne} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unmark' }));
    expect(onExportOne).toHaveBeenCalledWith('1');
    expect(onUnmarkOne).toHaveBeenCalledWith('1');
  });

  it('preview button calls onPreview', () => {
    const onPreview = vi.fn();
    render(<Card tweet={TWEET} onPreview={onPreview} />);
    fireEvent.click(screen.getByRole('button', { name: 'Önizle' }));
    expect(onPreview).toHaveBeenCalledWith('1');
  });

  it('hides action buttons when showActions=false', () => {
    render(<Card tweet={TWEET} showActions={false} />);
    expect(screen.queryByRole('button', { name: 'Export' })).toBeNull();
  });

  it('renders checkbox in selectionMode and calls toggle', () => {
    const onToggleSelect = vi.fn();
    render(
      <Card
        tweet={TWEET}
        selectionMode
        selected={false}
        onToggleSelect={onToggleSelect}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tappy seç' }));
    expect(onToggleSelect).toHaveBeenCalledWith('1');
  });

  it('renders img when media is present', () => {
    render(
      <Card tweet={{ ...TWEET, mediaUrls: ['https://pbs.twimg.com/m.jpg'] }} />
    );
    const img = document.querySelector('img[src*="pbs.twimg.com"]');
    expect(img).toBeTruthy();
    expect(img.src).toContain('name=small');
  });

  it('shows the quoted post when tweet.quoted is set', () => {
    const quoted = {
      authorName: 'Quoted User',
      authorHandle: 'quoted',
      avatarUrl: null,
      text: 'alıntılanan metin',
      mediaUrls: [],
      tweetUrl: 'https://x.com/quoted/status/9',
      createdAt: '2026-07-01T09:00:00.000Z',
    };
    render(<Card tweet={{ ...TWEET, quoted }} />);
    expect(screen.getByText('alıntılanan metin')).toBeTruthy();
    expect(screen.getByText('@quoted')).toBeTruthy();
  });

  it('hides the quoted block when quoted is null', () => {
    render(<Card tweet={TWEET} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
