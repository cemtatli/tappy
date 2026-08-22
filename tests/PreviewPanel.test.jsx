// tests/PreviewPanel.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreviewPanel } from '../src/page/components/PreviewPanel.jsx';

const TWEET = {
  id: '123',
  tweetUrl: 'https://x.com/tappy/status/123',
};

describe('PreviewPanel', () => {
  it('is closed (w-0) and empty when tweet is null', () => {
    render(<PreviewPanel tweet={null} />);
    const aside = screen.getByRole('complementary', { name: 'Tweet önizleme' });
    expect(aside.className).toContain('w-0');
    expect(screen.queryByTitle('Tweet önizleme')).toBeNull();
  });

  it('is open (w-[420px]) when tweet is set', () => {
    render(<PreviewPanel tweet={TWEET} />);
    const aside = screen.getByRole('complementary', { name: 'Tweet önizleme' });
    expect(aside.className).toContain('w-[420px]');
  });

  it('renders the correct embed iframe src', () => {
    render(<PreviewPanel tweet={TWEET} />);
    const iframe = screen.getByTitle('Tweet önizleme');
    expect(iframe.src).toBe(
      'https://platform.twitter.com/embed/Tweet.html?id=123&theme=light'
    );
  });

  it('open-on-X link points to the tweet URL', () => {
    render(<PreviewPanel tweet={TWEET} />);
    const link = screen.getByRole('link', { name: "X'te aç" });
    expect(link.href).toBe(TWEET.tweetUrl);
    expect(link.target).toBe('_blank');
  });

  it('close button calls onClose', () => {
    const onClose = vi.fn();
    render(<PreviewPanel tweet={TWEET} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Önizlemeyi kapat' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape key calls onClose', () => {
    const onClose = vi.fn();
    render(<PreviewPanel tweet={TWEET} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not listen for Escape when closed', () => {
    const onClose = vi.fn();
    render(<PreviewPanel tweet={null} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('updates iframe height on embed resize message', () => {
    render(<PreviewPanel tweet={TWEET} />);
    fireEvent(
      window,
      new MessageEvent('message', {
        origin: 'https://platform.twitter.com',
        data: {
          'twttr.embed': {
            method: 'twttr.private.resize',
            params: [{ height: 742 }],
          },
        },
      })
    );
    expect(screen.getByTitle('Tweet önizleme').style.height).toBe('742px');
  });

  it('ignores resize messages from foreign origins', () => {
    render(<PreviewPanel tweet={TWEET} />);
    fireEvent(
      window,
      new MessageEvent('message', {
        origin: 'https://evil.example',
        data: {
          'twttr.embed': {
            method: 'twttr.private.resize',
            params: [{ height: 999 }],
          },
        },
      })
    );
    expect(screen.getByTitle('Tweet önizleme').style.height).toBe('300px');
  });
});
