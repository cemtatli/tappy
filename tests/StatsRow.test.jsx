import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsRow } from '../src/page/components/StatsRow.jsx';

describe('StatsRow', () => {
  it('shows all three counters', () => {
    render(<StatsRow stats={{ likes: 12, retweets: 3, replies: 5 }} />);
    expect(screen.getByTestId('stat-replies').textContent).toContain('5');
    expect(screen.getByTestId('stat-retweets').textContent).toContain('3');
    expect(screen.getByTestId('stat-likes').textContent).toContain('12');
  });

  it('renders with 0 when stats is undefined', () => {
    render(<StatsRow />);
    expect(screen.getByTestId('stat-likes').textContent).toContain('0');
  });

  it('abbreviates thousands as B and millions as Mn', () => {
    render(
      <StatsRow stats={{ likes: 1500000, retweets: 2300, replies: 999 }} />
    );
    expect(screen.getByTestId('stat-likes').textContent).toContain('1,5 Mn');
    expect(screen.getByTestId('stat-retweets').textContent).toContain('2,3 B');
    expect(screen.getByTestId('stat-replies').textContent).toContain('999');
  });
});
