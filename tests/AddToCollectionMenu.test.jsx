// tests/AddToCollectionMenu.test.jsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddToCollectionMenu } from '../src/page/components/AddToCollectionMenu.jsx';

const collections = [
  { id: 'c1', name: 'Icons', imageKeys: [] },
  { id: 'c2', name: 'Memes', imageKeys: [] },
];

describe('AddToCollectionMenu', () => {
  it('toggles membership', () => {
    const onToggle = vi.fn();
    render(
      <AddToCollectionMenu
        open
        collections={collections}
        memberOf={new Set(['c1'])}
        onToggle={onToggle}
        onClose={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Memes'));
    expect(onToggle).toHaveBeenCalledWith('c2', true);
    fireEvent.click(screen.getByText('Icons'));
    expect(onToggle).toHaveBeenCalledWith('c1', false);
  });
});
