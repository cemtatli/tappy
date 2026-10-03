import { useState } from 'react';
import {
  Layers,
  Image as ImageIcon,
  Heart,
  Plus,
  MoreHorizontal,
  Settings,
  CheckSquare,
  Download,
  LayoutGrid,
  LayoutDashboard,
  Pencil,
  Trash2,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { FAVORITES_ID } from '../../shared/db.js';
import tappyMark from '../../assets/icons/tappy-mark.svg';
import { cn } from '../lib/cn.js';
import { Input } from './ui/Input.jsx';
import { SearchFilters } from './SearchFilters.jsx';
import { Segmented } from './ui/Segmented.jsx';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/DropdownMenu.jsx';
import {
  COLLECTION_COLORS,
  DEFAULT_COLLECTION_COLOR,
  COLLECTION_COLOR_NAMES,
} from '../lib/collectionColors.js';

const VIEW_MODES = [
  { value: 'grid', label: 'Grid', Icon: LayoutGrid },
  { value: 'canvas', label: 'Canvas', Icon: LayoutDashboard },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Yeni → Eski' },
  { value: 'date-asc', label: 'Eski → Yeni' },
  { value: 'likes-desc', label: 'En çok beğeni' },
];

function Row({ active, icon: Icon, dotColor, label, count, onClick, menu }) {
  return (
    <div
      className={cn(
        'group flex h-8 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-[13px] tracking-[0.01em] transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]',
        active
          ? 'bg-accent/10 font-medium text-accent'
          : 'text-muted hover:bg-black/5 hover:text-text'
      )}
      onClick={onClick}
    >
      {dotColor != null ? (
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : (
        <Icon size={15} className="shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {menu}
      <span
        className={cn(
          'text-[11px] tabular-nums',
          active ? 'text-accent/70' : 'text-muted'
        )}
      >
        {count}
      </span>
    </div>
  );
}

const FOOTER_ACTION =
  'flex h-8 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] tracking-[0.01em] text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-black/5 hover:text-text';

export function Sidebar({
  source,
  onSourceChange,
  collections,
  counts,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  resultCount,
  resultLabel,
  viewMode,
  onViewModeChange,
  sortMode,
  onSortChange,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  onSetCollectionColor,
  onOpenSettings,
  selectionMode,
  onToggleSelectionMode,
  onExportAll,
}) {
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLLECTION_COLOR);
  const [openMenuId, setOpenMenuId] = useState(null);

  function submitNew() {
    const name = newName.trim();
    if (name) onCreateCollection(name, selectedColor);
    setNewName('');
    setSelectedColor(DEFAULT_COLLECTION_COLOR);
    setCreating(false);
  }

  const collSource = typeof source === 'object' ? source.collectionId : null;
  const activeSort =
    SORT_OPTIONS.find((o) => o.value === sortMode) ?? SORT_OPTIONS[0];

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface p-3">
      <div className="mb-3 flex items-center gap-2 px-1">
        <img src={tappyMark} alt="" className="h-7 w-7" />
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-text">
          Tappy
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <Input
          variant="subtle"
          aria-label="Ara"
          placeholder="Ara"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
        <SearchFilters
          filters={filters}
          onChange={onFilterChange}
          onReset={onResetFilters}
          resultCount={resultCount}
          resultLabel={resultLabel}
        />

        {/* View controls */}
        <div className="mb-3 flex flex-col gap-1.5">
          <Segmented
            label="Görünüm"
            value={viewMode}
            options={VIEW_MODES}
            onChange={onViewModeChange}
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Sıralama"
              className={cn(
                FOOTER_ACTION,
                'justify-between bg-black/[0.04] text-text hover:bg-black/[0.07]'
              )}
            >
              <span className="truncate">{activeSort.label}</span>
              <ChevronsUpDown size={13} className="shrink-0 text-muted" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {SORT_OPTIONS.map((o) => (
                <DropdownMenuItem
                  key={o.value}
                  onClick={() => onSortChange(o.value)}
                >
                  <Check
                    size={14}
                    className={cn(
                      'shrink-0 text-accent',
                      o.value === sortMode ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {o.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Row
          active={source === 'all'}
          icon={Layers}
          label="Tümü"
          count={counts.all}
          onClick={() => onSourceChange('all')}
        />
        <Row
          active={source === 'images'}
          icon={ImageIcon}
          label="Görseller"
          count={counts.images}
          onClick={() => onSourceChange('images')}
        />
        <Row
          active={
            typeof source === 'object' && source?.collectionId === FAVORITES_ID
          }
          icon={Heart}
          label="Favoriler"
          count={counts.favorites ?? 0}
          onClick={() => onSourceChange({ collectionId: FAVORITES_ID })}
        />

        <div className="mt-4 mb-1 flex items-center justify-between px-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted">
            Koleksiyonlar
          </span>
          <button
            type="button"
            aria-label="Yeni koleksiyon"
            onClick={() => {
              setSelectedColor(DEFAULT_COLLECTION_COLOR);
              setCreating(true);
            }}
            className="text-muted hover:text-text"
          >
            <Plus size={15} />
          </button>
        </div>

        {creating && (
          <div className="mb-1">
            <Input
              autoFocus
              aria-label="Koleksiyon adı"
              placeholder="Ad..."
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
            <div className="flex flex-wrap gap-1.5 px-1 pb-1">
              {COLLECTION_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={COLLECTION_COLOR_NAMES[color]}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSelectedColor(color);
                  }}
                  className={cn(
                    'h-4 w-4 rounded-full transition-[box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
                    selectedColor === color
                      ? 'ring-2 ring-offset-1 ring-[color:var(--color-accent)]'
                      : 'hover:ring-1 hover:ring-offset-1 hover:ring-black/30'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          {collections.map((c) => (
            <Row
              key={c.id}
              active={collSource === c.id}
              icon={Layers}
              dotColor={c.color ?? '#8e8e93'}
              label={c.name}
              count={counts.byCollection.get(c.id) ?? 0}
              onClick={() => onSourceChange({ collectionId: c.id })}
              menu={
                <DropdownMenu
                  open={openMenuId === c.id}
                  onOpenChange={(open) => setOpenMenuId(open ? c.id : null)}
                >
                  <DropdownMenuTrigger
                    aria-label="Koleksiyon seçenekleri"
                    className="flex items-center justify-center rounded p-0.5 text-muted opacity-0 transition-opacity duration-[var(--dur-fast)] ease-[var(--ease-out)] group-hover:opacity-100 hover:text-text data-[popup-open]:opacity-100 focus-visible:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal size={14} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() => {
                        const name = prompt('Yeni ad', c.name);
                        if (name && name.trim())
                          onRenameCollection(c.id, name.trim());
                      }}
                    >
                      <Pencil size={14} />
                      Yeniden adlandır
                    </DropdownMenuItem>
                    <div className="px-4 pb-1 pt-2">
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                        Renk
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {COLLECTION_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={COLLECTION_COLOR_NAMES[color]}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSetCollectionColor(c.id, color);
                              setOpenMenuId(null);
                            }}
                            className={cn(
                              'h-4 w-4 rounded-full transition-[box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)]',
                              c.color === color
                                ? 'ring-2 ring-offset-1 ring-[color:var(--color-accent)]'
                                : 'hover:ring-1 hover:ring-offset-1 hover:ring-black/30'
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <DropdownMenuItem
                      className="text-danger"
                      onClick={() => onDeleteCollection(c.id)}
                    >
                      <Trash2 size={14} />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          ))}
        </div>
      </div>

      <div className="mt-3 border-t border-line pt-2">
        <button
          type="button"
          onClick={onToggleSelectionMode}
          className={FOOTER_ACTION}
        >
          <CheckSquare size={15} className="shrink-0" />
          {selectionMode ? 'Seçimi bitir' : 'Seç'}
        </button>
        <button type="button" onClick={onExportAll} className={FOOTER_ACTION}>
          <Download size={15} className="shrink-0" />
          Tümünü export et
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className={FOOTER_ACTION}
        >
          <Settings size={15} className="shrink-0" />
          Ayarlar
        </button>
      </div>
    </aside>
  );
}
