import { useEffect, useId, useState } from 'react';
import {
  Check,
  Heart,
  History,
  Image as ImageIcon,
  Layers,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { EMPTY_FILTERS } from '../../shared/filters.js';
import { FAVORITES_ID } from '../../shared/db.js';
import { Input } from './ui/Input.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/DropdownMenu.jsx';
import { cn } from '../lib/cn.js';
import {
  COLLECTION_COLORS,
  DEFAULT_COLLECTION_COLOR,
  COLLECTION_COLOR_NAMES,
} from '../lib/collectionColors.js';

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Yeni' },
  { value: 'date-asc', label: 'Eski' },
  { value: 'likes-desc', label: 'Beğeni' },
];

function SectionLabel({ children }) {
  return (
    <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
      {children}
    </p>
  );
}

function Pill({ active, className, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'flex h-9 items-center justify-center gap-1.5 rounded-full border px-3 text-[12px] font-medium transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        active
          ? 'border-text bg-text text-white'
          : 'border-line bg-white text-text hover:bg-black/[0.04]',
        className
      )}
      {...props}
    >
      {children}
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
  onLoadOlder,
  loadingOlder,
}) {
  const id = useId();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLLECTION_COLOR);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const activeSourceId =
    typeof source === 'object' ? source.collectionId : source;
  const activeCount = Object.keys(EMPTY_FILTERS).filter(
    (key) =>
      key !== 'search' &&
      filters[key] != null &&
      filters[key] !== EMPTY_FILTERS[key]
  ).length;
  const hasFilters = activeCount > 0 || Boolean(filters.search?.trim());
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
        className="pointer-events-auto fixed bottom-24 left-1/2 z-40 max-h-[min(78vh,760px)] w-[min(92vw,420px)] overflow-y-auto rounded-[22px] border border-line/90 bg-[#fffefa]/95 p-4 shadow-[0_1px_2px_rgba(28,27,24,0.05),0_24px_70px_-24px_rgba(28,27,24,0.45)] backdrop-blur-2xl animate-[menu-in_var(--dur-base)_var(--ease-out)]"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-text">
              Filtreler
            </h2>
            <p className="mt-0.5 text-[11px] text-muted">
              {resultCount} görsel gösteriliyor
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onReset}
              disabled={!hasFilters}
              className="rounded-full px-2 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent/5 disabled:opacity-40"
            >
              Temizle
            </button>
            <button
              type="button"
              aria-label="Filtreleri kapat"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-text"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <SectionLabel>Kaynak</SectionLabel>
        <div className="grid grid-cols-3 gap-1.5">
          <Pill active={source === 'all'} onClick={() => onSourceChange('all')}>
            <Layers size={13} />
            Tümü
          </Pill>
          <Pill
            active={source === 'images'}
            onClick={() => onSourceChange('images')}
          >
            <ImageIcon size={13} />
            Görseller
          </Pill>
          <Pill
            active={activeSourceId === FAVORITES_ID}
            onClick={() => onSourceChange({ collectionId: FAVORITES_ID })}
          >
            <Heart size={13} />
            Favoriler
          </Pill>
        </div>

        <div className="mb-2 mt-5 flex items-center justify-between">
          <SectionLabel>Koleksiyonlar</SectionLabel>
          <button
            type="button"
            aria-label="Yeni koleksiyon"
            onClick={() => {
              setSelectedColor(DEFAULT_COLLECTION_COLOR);
              setCreating(true);
            }}
            className="-mt-2 flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-black/5 hover:text-text"
          >
            <Plus size={15} />
          </button>
        </div>

        {creating && (
          <div className="mb-2 rounded-xl bg-black/[0.035] p-2">
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
              className="mb-1 w-full bg-white"
            />
            <ColorDots value={selectedColor} onChange={setSelectedColor} />
          </div>
        )}

        {collections.length === 0 && !creating ? (
          <p className="rounded-xl border border-dashed border-line px-3 py-3 text-[12px] leading-relaxed text-muted">
            Henüz koleksiyon yok. Görselleri gruplamak için bir tane oluştur.
          </p>
        ) : (
          <div className="space-y-0.5">
            {collections.map((collection) => {
              const active = activeSourceId === collection.id;
              return (
                <div
                  key={collection.id}
                  className={cn(
                    'group flex items-center rounded-lg transition-colors',
                    active ? 'bg-black/[0.055]' : 'hover:bg-black/[0.035]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() =>
                      onSourceChange({ collectionId: collection.id })
                    }
                    className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left text-[13px]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: collection.color ?? '#8e8e93',
                      }}
                    />
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate',
                        active ? 'font-medium text-text' : 'text-text'
                      )}
                    >
                      {collection.name}
                    </span>
                    <span className="text-[11px] tabular-nums text-muted">
                      {counts.byCollection.get(collection.id) ?? 0}
                    </span>
                  </button>
                  <DropdownMenu
                    open={openMenuId === collection.id}
                    onOpenChange={(next) =>
                      setOpenMenuId(next ? collection.id : null)
                    }
                  >
                    <DropdownMenuTrigger
                      aria-label="Koleksiyon seçenekleri"
                      className="mr-1 flex h-7 w-7 items-center justify-center rounded-full text-muted opacity-0 transition-opacity hover:bg-black/5 hover:text-text focus-visible:opacity-100 data-[popup-open]:opacity-100 group-hover:opacity-100"
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
        )}

        <div className="mb-2 mt-5">
          <SectionLabel>Sırala</SectionLabel>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SORT_OPTIONS.map((option) => (
            <Pill
              key={option.value}
              active={sortMode === option.value}
              onClick={() => onSortChange(option.value)}
            >
              {sortMode === option.value && <Check size={12} />}
              {option.label}
            </Pill>
          ))}
        </div>

        <div className="mb-2 mt-5 flex items-center justify-between">
          <SectionLabel>Gelişmiş</SectionLabel>
          {activeCount > 0 && (
            <span className="mb-2 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium tabular-nums text-accent">
              {activeCount}
            </span>
          )}
        </div>
        <div className="space-y-3">
          <label className="block text-[11px] text-muted">
            Yazar
            <Input
              variant="subtle"
              placeholder="Ad veya @kullanıcı"
              value={filters.author ?? ''}
              onChange={(e) => onChange('author', e.target.value)}
              className="mt-1 min-h-10 w-full bg-white"
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
                  className="mt-1 min-h-10 w-full min-w-0 bg-white"
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
                  className="mt-1 min-h-10 w-full min-w-0 bg-white"
                />
              </label>
            </div>
            {invalidRange && (
              <p role="alert" className="text-[11px] text-danger">
                Bitiş tarihi başlangıçtan önce olamaz.
              </p>
            )}
          </div>
          <fieldset>
            <legend className="mb-1 text-[11px] text-muted">Medya</legend>
            <div className="flex gap-1.5">
              {[
                ['all', 'Tümü'],
                ['with-media', 'Görselli'],
                ['text-only', 'Görselsiz'],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-[11.5px] transition-colors',
                    (filters.media ?? 'all') === value
                      ? 'border-text bg-text text-white'
                      : 'border-line bg-white text-text hover:bg-black/[0.04]'
                  )}
                >
                  <input
                    type="radio"
                    name={`${id}-media`}
                    value={value}
                    checked={(filters.media ?? 'all') === value}
                    onChange={() => onChange('media', value)}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
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
              className="mt-1 min-h-10 w-full bg-white"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line/80 pt-2">
          <button
            type="button"
            onClick={onLoadOlder}
            disabled={loadingOlder}
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[11.5px] font-medium text-muted transition-colors hover:bg-black/[0.04] hover:text-text disabled:opacity-50"
          >
            <History size={13} />
            {loadingOlder ? 'Yükleniyor…' : 'Daha eski kayıtlar'}
          </button>
          <button
            type="button"
            disabled={!hasFilters}
            onClick={onReset}
            className="rounded-full px-2.5 py-1.5 text-[11.5px] font-medium text-accent transition-colors hover:bg-accent/5 disabled:opacity-40"
          >
            Filtreleri temizle
          </button>
        </div>
        <p className="mt-1 px-2 text-[10.5px] tabular-nums text-muted">
          {resultCount} görsel · X bookmark’larından
        </p>
      </div>
    </>
  );
}
