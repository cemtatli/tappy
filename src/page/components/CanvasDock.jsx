import { lazy, Suspense, useState } from 'react';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';

// The panel's collection menu pulls in Base UI; keep it out of the first load.
export const loadFilterPanel = () => import('./FilterPanel.jsx');
const FilterPanel = lazy(() =>
  loadFilterPanel().then((module) => ({ default: module.FilterPanel }))
);

export function CanvasDock({
  search,
  onSearchChange,
  searchInputRef,
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
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
  const [filterMounted, setFilterMounted] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
      <div
        className="chrome-in pointer-events-auto flex w-full max-w-[680px] items-center justify-center gap-2"
        style={{ '--chrome-delay': '80ms' }}
      >
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-muted"
          />
          <Input
            ref={searchInputRef}
            aria-label="Ara"
            type="text"
            placeholder="Bir şey ara…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-12 rounded-full pl-10 pr-11"
          />
          {search ? (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Aramayı temizle"
              onClick={() => onSearchChange('')}
              className="absolute right-1.5 top-1/2 size-8 min-w-8 -translate-y-1/2 px-0"
            >
              <X size={13} />
            </Button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-black/[0.07] bg-black/[0.035] px-1.5 py-0.5 text-[10px] font-medium text-muted sm:block">
              ⌘K
            </kbd>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          aria-label="Filtreler"
          aria-expanded={filterOpen}
          aria-pressed={filterOpen}
          aria-controls="filters-panel"
          title="Filtreler"
          onClick={() => {
            setFilterMounted(true);
            setFilterOpen((open) => !open);
          }}
          className="relative size-12 min-w-12 px-0"
        >
          <SlidersHorizontal size={17} />
          {activeFilterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 z-10 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-surface-2 bg-accent px-1 text-[9px] font-semibold tabular-nums text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Button
          variant="default"
          size="sm"
          aria-label="Şaşırt beni"
          title="Rastgele bir bookmark göster (S)"
          onClick={() => {
            setFilterOpen(false);
            onSurprise();
          }}
          disabled={surpriseDisabled}
          className="size-12 min-w-12 px-0"
        >
          <Sparkles size={18} />
        </Button>
      </div>

      {filterMounted && (
        <Suspense fallback={null}>
          <FilterPanel
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            filters={filters}
            onChange={onFilterChange}
            onReset={onResetFilters}
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
        </Suspense>
      )}
    </div>
  );
}
