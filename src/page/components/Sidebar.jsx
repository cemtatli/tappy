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
} from 'lucide-react';
import { FAVORITES_ID } from '../../shared/db.js';
import tappyMark from '../../assets/icons/tappy-mark.svg';
import { cn } from '../lib/cn.js';
import { Input } from './ui/Input.jsx';
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
        'group flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm',
        active ? 'bg-surface text-text' : 'text-muted hover:bg-black/5'
      )}
      onClick={onClick}
    >
      {dotColor != null ? (
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
      ) : (
        <Icon size={16} />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {menu}
      <span className="text-xs tabular-nums text-muted">{count}</span>
    </div>
  );
}

export function Sidebar({
  source,
  onSourceChange,
  collections,
  counts,
  search,
  onSearchChange,
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

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-line bg-surface-2 p-3">
      <div className="mb-3 flex items-center gap-2 px-1">
        <img src={tappyMark} alt="" className="h-7 w-7" />
        <span className="text-[15px] font-semibold tracking-tight text-text">
          Tappy
        </span>
      </div>
      <Input
        aria-label="Ara"
        placeholder="Ara..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="mb-3 w-full"
      />

      {/* View controls */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="flex items-center gap-1 rounded-full bg-surface p-1">
          {VIEW_MODES.map(({ value, label, Icon }) => {
            const active = viewMode === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={String(active)}
                onClick={() => onViewModeChange(value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1 text-sm transition-[transform,background-color] duration-[var(--dur-base)] ease-[var(--ease-out)]',
                  active ? 'bg-accent text-white' : 'text-muted hover:text-text'
                )}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
        <select
          aria-label="Sıralama"
          value={sortMode}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full rounded-[var(--radius)] border border-line bg-white px-2 py-1.5 text-sm text-text"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
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

      <div className="min-h-0 flex-1 overflow-y-auto">
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
                    onSelect={() => {
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
                    onSelect={() => onDeleteCollection(c.id)}
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

      {/* Shortcut hint */}
      <div className="mt-2 flex items-center justify-between px-2.5 text-xs text-muted">
        <span>Görünüm</span>
        <span className="flex gap-1">
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px]">
            G
          </kbd>
          <kbd className="rounded border border-line bg-surface px-1.5 py-0.5 font-sans text-[11px]">
            C
          </kbd>
        </span>
      </div>

      {/* Sidebar footer */}
      <div className="mt-2 border-t border-line pt-2">
        <button
          type="button"
          onClick={onToggleSelectionMode}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-black/5 hover:text-text"
        >
          <CheckSquare size={16} /> {selectionMode ? 'Seçimi bitir' : 'Seç'}
        </button>
        <button
          type="button"
          onClick={onExportAll}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-black/5 hover:text-text"
        >
          <Download size={16} /> Tümünü export et
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:bg-black/5 hover:text-text"
        >
          <Settings size={16} /> Ayarlar
        </button>
      </div>
    </aside>
  );
}
