import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { QuotedTweet } from '../src/page/components/QuotedTweet.jsx';

afterEach(cleanup);

const QUOTED = {
  authorName: 'Quoted User',
  authorHandle: 'quoted',
  avatarUrl: null,
  text: 'alıntılanan metin',
  mediaUrls: [],
  tweetUrl: 'https://x.com/quoted/status/999',
  createdAt: '2026-07-01T09:00:00.000Z',
};

describe('QuotedTweet', () => {
  it('renders nothing when quoted is null', () => {
    const { container } = render(<QuotedTweet quoted={null} />);
    expect(container.textContent).toBe('');
  });

  it('shows author, handle, date and text', () => {
    render(<QuotedTweet quoted={QUOTED} />);
    expect(screen.getByText('Quoted User')).toBeTruthy();
    expect(screen.getByText('@quoted')).toBeTruthy();
    expect(screen.getByText('alıntılanan metin')).toBeTruthy();
    expect(screen.getByText(/1 Tem 2026/)).toBeTruthy();
  });

  it('renders an img when media is present', () => {
    render(
      <QuotedTweet
        quoted={{ ...QUOTED, mediaUrls: ['https://pbs.twimg.com/q.jpg'] }}
      />
    );
    const img = document.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('pbs.twimg.com');
    expect(img.src).toContain('name=small');
  });

  it('opens the quoted tweet link on click', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<QuotedTweet quoted={QUOTED} />);
    fireEvent.click(screen.getByRole('link'));
    expect(openSpy).toHaveBeenCalledWith(
      'https://x.com/quoted/status/999',
      '_blank',
      'noopener,noreferrer'
    );
    openSpy.mockRestore();
  });
});
