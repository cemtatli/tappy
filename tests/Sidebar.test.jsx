import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../src/page/components/Sidebar.jsx';

const base = {
  source: 'all',
  onSourceChange: vi.fn(),
  collections: [
    {
      id: 'c1',
      name: 'App Icons',
      order: 1,
      createdAt: '',
      imageKeys: ['1:0'],
    },
  ],
  counts: {
    all: 10,
    images: 4,
    byCollection: new Map([['c1', 1]]),
    favorites: 2,
  },
  search: '',
  onSearchChange: vi.fn(),
  viewMode: 'grid',
  onViewModeChange: vi.fn(),
  sortMode: 'date-desc',
  onSortChange: vi.fn(),
  onCreateCollection: vi.fn(),
  onRenameCollection: vi.fn(),
  onDeleteCollection: vi.fn(),
  onSetCollectionColor: vi.fn(),
  onOpenSettings: vi.fn(),
  selectionMode: false,
  onToggleSelectionMode: vi.fn(),
  onExportAll: vi.fn(),
};

describe('Sidebar', () => {
  it('renders sources with counts and selects one', () => {
    const onSourceChange = vi.fn();
    render(<Sidebar {...base} onSourceChange={onSourceChange} />);
    expect(screen.getByText('Görseller')).toBeTruthy();
    fireEvent.click(screen.getByText('Görseller'));
    expect(onSourceChange).toHaveBeenCalledWith('images');
  });

  it('renders collections and selects one', () => {
    const onSourceChange = vi.fn();
    render(<Sidebar {...base} onSourceChange={onSourceChange} />);
    fireEvent.click(screen.getByText('App Icons'));
    expect(onSourceChange).toHaveBeenCalledWith({ collectionId: 'c1' });
  });

  it('typing in search calls onSearchChange', () => {
    const onSearchChange = vi.fn();
    render(<Sidebar {...base} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByLabelText('Ara'), { target: { value: 'x' } });
    expect(onSearchChange).toHaveBeenCalledWith('x');
  });

  it('renders the Tappy wordmark and footer actions', () => {
    const onExportAll = vi.fn();
    render(<Sidebar {...base} onExportAll={onExportAll} />);
    expect(screen.getByText('Tappy')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /tümünü export/i }));
    expect(onExportAll).toHaveBeenCalled();
  });

  it('view switcher calls onViewModeChange', () => {
    const onViewModeChange = vi.fn();
    render(
      <Sidebar {...base} viewMode="grid" onViewModeChange={onViewModeChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: /canvas/i }));
    expect(onViewModeChange).toHaveBeenCalledWith('canvas');
  });

  it('sort menu shows the active option and calls onSortChange', async () => {
    const onSortChange = vi.fn();
    render(<Sidebar {...base} onSortChange={onSortChange} />);
    const trigger = screen.getByRole('button', { name: /sıralama/i });
    expect(trigger.textContent).toContain('Yeni → Eski');
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText('Eski → Yeni'));
    expect(onSortChange).toHaveBeenCalledWith('date-asc');
  });

  it('does not use a native select for sorting', () => {
    const { container } = render(<Sidebar {...base} />);
    expect(container.querySelector('select')).toBeNull();
  });

  it('marks the active view on the segmented control', () => {
    render(<Sidebar {...base} viewMode="canvas" />);
    expect(
      screen
        .getByRole('button', { name: /canvas/i })
        .getAttribute('aria-pressed')
    ).toBe('true');
    expect(
      screen.getByRole('button', { name: /grid/i }).getAttribute('aria-pressed')
    ).toBe('false');
  });

  it('deletes a collection from its context menu', async () => {
    const onDeleteCollection = vi.fn();
    render(<Sidebar {...base} onDeleteCollection={onDeleteCollection} />);
    fireEvent.click(
      screen.getByRole('button', { name: /koleksiyon seçenekleri/i })
    );
    fireEvent.click(await screen.findByText('Sil'));
    expect(onDeleteCollection).toHaveBeenCalledWith('c1');
  });

  it('renames a collection from its context menu', async () => {
    const onRenameCollection = vi.fn();
    vi.spyOn(window, 'prompt').mockReturnValue('Yeni ad');
    render(<Sidebar {...base} onRenameCollection={onRenameCollection} />);
    fireEvent.click(
      screen.getByRole('button', { name: /koleksiyon seçenekleri/i })
    );
    fireEvent.click(await screen.findByText('Yeniden adlandır'));
    expect(onRenameCollection).toHaveBeenCalledWith('c1', 'Yeni ad');
  });
});
