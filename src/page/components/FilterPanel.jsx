import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Heart,
  History,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { EMPTY_FILTERS } from '../../shared/filters.js';
import { FAVORITES_ID } from '../../shared/db.js';
import { Input } from './ui/Input.jsx';
import { Button } from './ui/Button.jsx';
import { Segmented } from './ui/Segmented.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/DropdownMenu.jsx';
import { cn } from '../lib/cn.js';
import { useExitPresence } from '../lib/usePresence.js';
import {
  COLLECTION_COLORS,
  DEFAULT_COLLECTION_COLOR,
  COLLECTION_COLOR_NAMES,
} from '../lib/collectionColors.js';

// Matches --dur-exit in app.css.
const EXIT_MS = 160;

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Yeni' },
  { value: 'date-asc', label: 'Eski' },
  { value: 'likes-desc', label: 'Beğeni' },
];

function SourceRow({ active, onClick, icon, label, count }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-text transition-colors',
        active ? 'bg-black/[0.055] font-medium' : 'hover:bg-black/[0.035]'
      )}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null && (
        <span className="pr-0.5 text-[11px] font-normal tabular-nums text-muted transition-opacity group-focus-within:opacity-0 group-hover:opacity-0">
          {count}
        </span>
      )}
    </button>
  );
}

function ColorDots({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 px-1 py-1">
      {COLLECTION_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          aria-label={COLLECTION_COLOR_NAMES[color]}
          aria-pressed={value === color}
          onClick={() => onChange(color)}
          className={cn(
            'h-4 w-4 rounded-full transition-[box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
            value === color
              ? 'ring-2 ring-offset-1 ring-[color:var(--color-accent)]'
              : 'hover:ring-1 hover:ring-offset-1 hover:ring-black/30'
          )}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

export function FilterPanel({
  open,
  onClose,
  filters,
  onChange,
  onReset,
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
  onLoadOlder,
  loadingOlder,
}) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLLECTION_COLOR);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const { mounted, closing } = useExitPresence(open, EXIT_MS);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const activeSourceId =
    typeof source === 'object' ? source.collectionId : source;
  const activeCount = Object.keys(EMPTY_FILTERS).filter(
    (key) =>
      key !== 'search' &&
      filters[key] != null &&
      filters[key] !== EMPTY_FILTERS[key]
  ).length;
  const hasFilters = activeCount > 0 || Boolean(filters.search?.trim());
  // An active filter must not hide behind a closed section.
  const showMore = moreOpen || activeCount > 0;
  const invalidRange =
    filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo;

  function submitNew() {
    const name = newName.trim();
    if (name) onCreateCollection(name, selectedColor);
    setNewName('');
    setSelectedColor(DEFAULT_COLLECTION_COLOR);
    setCreating(false);
  }

  return (
    <>
      <div
        className="pointer-events-auto fixed inset-0 z-30"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        id="filters-panel"
        role="dialog"
        aria-label="Filtreler"
        style={{ transform: 'translateX(-50%)' }}
        className={cn(
          'glass pointer-events-auto fixed left-1/2 top-[72px] z-40 max-h-[min(calc(100vh-176px),760px)] w-[min(92vw,340px)] overflow-y-auto rounded-[20px] bg-white/85 p-3',
          closing
            ? 'animate-[panel-drop-out_var(--dur-exit)_var(--ease-out)_forwards]'
            : 'animate-[panel-drop-in_var(--dur-slow)_var(--ease-out)]'
        )}
      >
        <div className="mb-2 flex h-7 items-center justify-between pl-2.5">
          <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-text">
            Filtreler
          </h2>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Filtreleri temizle"
              onClick={onReset}
              className="h-7 px-2.5 text-[12px] font-medium text-muted hover:text-text"
            >
              Temizle
            </Button>
          )}
        </div>

        <div className="space-y-0.5">
          <div className="flex">
            <SourceRow
              active={activeSourceId === 'all'}
              onClick={() => onSourceChange('all')}
              icon={<Layers size={14} className="shrink-0 text-muted" />}
              label="Tümü"
            />
          </div>
          <div className="flex">
            <SourceRow
              active={activeSourceId === FAVORITES_ID}
              onClick={() => onSourceChange({ collectionId: FAVORITES_ID })}
              icon={<Heart size={14} className="shrink-0 text-muted" />}
              label="Favoriler"
              count={counts.favorites}
            />
          </div>
        </div>

        <div className="mt-0.5 space-y-0.5">
          {collections.map((collection) => {
            const active = activeSourceId === collection.id;
            return (
              <div
                key={collection.id}
                className="group relative flex items-center"
              >
                <SourceRow
                  active={active}
                  onClick={() =>
                    onSourceChange({ collectionId: collection.id })
                  }
                  icon={
                    <span
                      className="ml-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: collection.color ?? '#8e8e93',
                      }}
                    />
                  }
                  label={collection.name}
                  count={counts.byCollection.get(collection.id) ?? 0}
                />
                <DropdownMenu
                  open={openMenuId === collection.id}
                  onOpenChange={(next) =>
                    setOpenMenuId(next ? collection.id : null)
                  }
                >
                  <DropdownMenuTrigger
                    aria-label="Koleksiyon seçenekleri"
                    className="absolute right-1 flex h-7 w-7 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-black/5 hover:text-text focus-visible:opacity-100 data-[popup-open]:opacity-100 group-hover:opacity-100"
                  >
                    <MoreHorizontal size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        const name = prompt('Yeni ad', collection.name);
                        if (name && name.trim())
                          onRenameCollection(collection.id, name.trim());
                      }}
                    >
                      <Pencil size={14} />
                      Yeniden adlandır
                    </DropdownMenuItem>
                    <div className="px-4 pb-1 pt-2">
                      <p className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted">
                        Renk
                      </p>
                      <ColorDots
                        value={collection.color}
                        onChange={(color) =>
                          onSetCollectionColor(collection.id, color)
                        }
                      />
                    </div>
                    <DropdownMenuItem
                      className="text-danger"
                      onClick={() => onDeleteCollection(collection.id)}
                    >
                      <Trash2 size={14} />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>

        {!creating && (
          <button
            type="button"
            onClick={() => {
              setSelectedColor(DEFAULT_COLLECTION_COLOR);
              setCreating(true);
            }}
            className="mt-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted transition-colors hover:bg-black/[0.035] hover:text-text"
          >
            <Plus size={14} className="shrink-0" />
            Yeni koleksiyon
          </button>
        )}

        {creating && (
          <div className="mt-1 rounded-xl bg-black/[0.035] p-2">
            <Input
              autoFocus
              aria-label="Koleksiyon adı"
              placeholder="Koleksiyon adı..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNew();
                if (e.key === 'Escape') setCreating(false);
              }}
              onBlur={submitNew}
              variant="subtle"
              className="mb-1 w-full"
            />
            <ColorDots value={selectedColor} onChange={setSelectedColor} />
          </div>
        )}

        <div className="mt-2 border-t border-black/[0.06] pt-3">
          <Segmented
            label="Sırala"
            value={sortMode}
            options={SORT_OPTIONS}
            onChange={onSortChange}
          />
        </div>

        <div className="mt-2">
          <button
            type="button"
            aria-expanded={showMore}
            onClick={() => setMoreOpen(!showMore)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] text-muted transition-colors hover:bg-black/[0.035] hover:text-text"
          >
            Daha fazla filtre
            <span className="flex items-center gap-1.5">
              {activeCount > 0 && (
                <span className="rounded-full bg-black/[0.06] px-1.5 text-[10px] font-medium tabular-nums text-text">
                  {activeCount}
                </span>
              )}
              <ChevronDown
                size={14}
                className={cn(
                  'transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)]',
                  showMore && 'rotate-180'
                )}
              />
            </span>
          </button>
          {showMore && (
            <div className="px-2.5 pb-1 pt-1">
              <div className="space-y-3">
                <label className="block text-[11px] text-muted">
                  Yazar
                  <Input
                    variant="subtle"
                    placeholder="Ad veya @kullanıcı"
                    value={filters.author ?? ''}
                    onChange={(e) => onChange('author', e.target.value)}
                    className="mt-1 min-h-10 w-full"
                  />
                </label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[11px] text-muted">
                      Başlangıç
                      <Input
                        variant="subtle"
                        type="date"
                        value={filters.dateFrom ?? ''}
                        onChange={(e) => onChange('dateFrom', e.target.value)}
                        aria-invalid={Boolean(invalidRange)}
                        className="mt-1 min-h-10 w-full min-w-0"
                      />
                    </label>
                    <label className="block text-[11px] text-muted">
                      Bitiş
                      <Input
                        variant="subtle"
                        type="date"
                        value={filters.dateTo ?? ''}
                        onChange={(e) => onChange('dateTo', e.target.value)}
                        aria-invalid={Boolean(invalidRange)}
                        className="mt-1 min-h-10 w-full min-w-0"
                      />
                    </label>
                  </div>
                  {invalidRange && (
                    <p role="alert" className="text-[11px] text-danger">
                      Bitiş tarihi başlangıçtan önce olamaz.
                    </p>
                  )}
                </div>
                <label className="block text-[11px] text-muted">
                  Minimum beğeni
                  <Input
                    variant="subtle"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Sınır yok"
                    value={filters.minLikes ?? ''}
                    onChange={(e) => onChange('minLikes', e.target.value)}
                    className="mt-1 min-h-10 w-full"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLoadOlder}
          disabled={loadingOlder}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-muted transition-colors hover:bg-black/[0.035] hover:text-text disabled:opacity-50"
        >
          <History size={14} className="shrink-0" />
          {loadingOlder ? 'Yükleniyor…' : 'Daha eski kayıtlar'}
        </button>
      </div>
    </>
  );
}
