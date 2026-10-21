import { useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { FilterPanel } from './FilterPanel.jsx';

const glass =
  'border border-line/80 bg-white/80 shadow-[0_1px_2px_rgba(28,27,24,0.04),0_14px_40px_-20px_rgba(28,27,24,0.4)] backdrop-blur-xl';

export function CanvasDock({
  search,
  onSearchChange,
  searchInputRef,
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  resultCount,
  source,
  onSourceChange,
  collections,
  counts,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onSetCollectionColor,
  sortMode,
  onSortChange,
  onSurprise,
  surpriseDisabled,
  onLoadOlder,
  loadingOlder,
}) {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-[680px] items-center justify-center gap-2">
        <div
          className={cn(
            'flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-full px-4 transition-[border-color,background-color,box-shadow] duration-[var(--dur-fast)] focus-within:border-black/20 focus-within:bg-white',
            glass
          )}
        >
          <Search size={16} className="shrink-0 text-muted" />
          <input
            ref={searchInputRef}
            aria-label="Ara"
            type="text"
            placeholder="Bir şey ara…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[13.5px] tracking-[0.005em] text-text outline-none placeholder:text-muted"
          />
          {search ? (
            <button
              type="button"
              aria-label="Aramayı temizle"
              onClick={() => onSearchChange('')}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-text"
            >
              <X size={13} />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded-md border border-line bg-white px-1.5 py-0.5 text-[10px] font-medium text-muted sm:block">
              ⌘K
            </kbd>
          )}
        </div>

        <button
          type="button"
          aria-label="Filtreler"
          aria-expanded={filterOpen}
          aria-controls="filters-panel"
          title="Filtreler"
          onClick={() => setFilterOpen((open) => !open)}
          className={cn(
            'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-[background-color,border-color,color,transform] duration-[var(--dur-fast)] active:scale-95',
            filterOpen
              ? 'border border-text bg-text text-white shadow-[0_14px_40px_-18px_rgba(28,27,24,0.7)] hover:bg-black'
              : cn(glass, 'text-text hover:bg-white')
          )}
        >
          <SlidersHorizontal size={17} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface-2 bg-accent px-1 text-[9px] font-semibold tabular-nums text-white">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          aria-label="Şaşırt beni"
          title="Rastgele bir bookmark göster (S)"
          onClick={() => {
            setFilterOpen(false);
            onSurprise();
          }}
          disabled={surpriseDisabled}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-text bg-text px-4 text-[12.5px] font-medium text-white shadow-[0_14px_40px_-18px_rgba(28,27,24,0.7)] transition-[background-color,transform,opacity] duration-[var(--dur-fast)] hover:bg-black active:scale-[0.97] disabled:opacity-40 sm:px-5"
        >
          <Sparkles size={15} />
          <span className="hidden sm:inline">Şaşırt beni</span>
        </button>
      </div>

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={onFilterChange}
        onReset={onResetFilters}
        resultCount={resultCount}
        source={source}
        onSourceChange={onSourceChange}
        collections={collections}
        counts={counts}
        onCreateCollection={onCreateCollection}
        onRenameCollection={onRenameCollection}
        onDeleteCollection={onDeleteCollection}
        onSetCollectionColor={onSetCollectionColor}
        sortMode={sortMode}
        onSortChange={onSortChange}
        onLoadOlder={onLoadOlder}
        loadingOlder={loadingOlder}
      />
    </div>
  );
}
