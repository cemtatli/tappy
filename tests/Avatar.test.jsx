import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from '../src/page/components/Avatar.jsx';

describe('Avatar', () => {
  it('renders an img when src is provided', () => {
    render(<Avatar name="Tappy" src="https://pbs.twimg.com/x.jpg" />);
    const img = screen.getByRole('img', { name: 'Tappy' });
    expect(img.getAttribute('src')).toBe('https://pbs.twimg.com/x.jpg');
  });

  it('pins img size via CSS (flex stretch regression)', () => {
    render(<Avatar name="Tappy" src="https://pbs.twimg.com/x.jpg" size={40} />);
    const img = screen.getByRole('img', { name: 'Tappy' });
    expect(img.style.width).toBe('40px');
    expect(img.style.height).toBe('40px');
    expect(img.className).toContain('self-start');
  });

  it('renders an initial badge when no src', () => {
    render(<Avatar name="Tappy" />);
    const badge = screen.getByLabelText('Tappy');
    expect(badge.textContent).toBe('T');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows ? for an empty name', () => {
    render(<Avatar name="" />);
    expect(screen.getByLabelText('Avatar').textContent).toBe('?');
  });
});
