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

describe('AddToCollectionMenu creating', () => {
  it('can create the first collection when none exist', () => {
    const onCreate = vi.fn();
    render(
      <AddToCollectionMenu
        open
        collections={[]}
        memberOf={new Set()}
        onToggle={vi.fn()}
        onCreate={onCreate}
        onClose={vi.fn()}
      />
    );
    const input = screen.getByLabelText('Yeni koleksiyon adı');
    expect(document.activeElement).toBe(input);
    fireEvent.change(input, { target: { value: '  Icons ' } });
    fireEvent.submit(input.closest('form'));
    expect(onCreate).toHaveBeenCalledWith('Icons');
    expect(input.value).toBe('');
  });

  it('ignores a blank name', () => {
    const onCreate = vi.fn();
    render(
      <AddToCollectionMenu
        open
        collections={[]}
        memberOf={new Set()}
        onToggle={vi.fn()}
        onCreate={onCreate}
        onClose={vi.fn()}
      />
    );
    const input = screen.getByLabelText('Yeni koleksiyon adı');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form'));
    expect(onCreate).not.toHaveBeenCalled();
  });

  it('closes on Escape without reaching window listeners', () => {
    const onClose = vi.fn();
    const onWindowKey = vi.fn();
    window.addEventListener('keydown', onWindowKey);
    render(
      <AddToCollectionMenu
        open
        collections={[]}
        memberOf={new Set()}
        onToggle={vi.fn()}
        onClose={onClose}
      />
    );
    fireEvent.keyDown(screen.getByLabelText('Yeni koleksiyon adı'), {
      key: 'Escape',
    });
    window.removeEventListener('keydown', onWindowKey);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onWindowKey).not.toHaveBeenCalled();
  });
});
