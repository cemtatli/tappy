import { useId, useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { EMPTY_FILTERS } from '../../shared/filters.js';
import { Input } from './ui/Input.jsx';
import { cn } from '../lib/cn.js';

export function SearchFilters({
  filters = EMPTY_FILTERS,
  onChange,
  onReset,
  resultCount,
  resultLabel = 'bookmark',
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const activeCount = Object.keys(EMPTY_FILTERS).filter(
    (key) =>
      key !== 'search' &&
      filters[key] != null &&
      filters[key] !== EMPTY_FILTERS[key]
  ).length;
  const hasFilters = activeCount > 0 || Boolean(filters.search?.trim());
  const invalidRange =
    filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo;

  return (
    <div className="mb-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2.5 text-[13px] text-muted transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-accent"
      >
        <SlidersHorizontal size={15} />
        <span className="flex-1 text-left">Gelişmiş arama</span>
        {activeCount > 0 && (
          <span className="rounded-full bg-accent/10 px-2 text-xs tabular-nums text-accent">
            {activeCount}
          </span>
        )}
        <ChevronDown
          size={14}
          className={cn('transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          id={`${id}-panel`}
          className="mt-1 space-y-3 rounded-xl bg-black/[0.025] p-2"
        >
          <label className="block text-xs text-muted">
            Yazar
            <Input
              variant="subtle"
              placeholder="Ad veya @kullanıcı"
              value={filters.author ?? ''}
              onChange={(e) => onChange('author', e.target.value)}
              className="mt-1 min-h-10 w-full"
            />
          </label>
          <div className="space-y-2" aria-describedby={`${id}-date-help`}>
            <label className="block text-xs text-muted">
              Başlangıç tarihi
              <Input
                variant="subtle"
                type="date"
                value={filters.dateFrom ?? ''}
                onChange={(e) => onChange('dateFrom', e.target.value)}
                aria-invalid={Boolean(invalidRange)}
                aria-describedby={
                  invalidRange ? `${id}-date-error` : `${id}-date-help`
                }
                className="mt-1 min-h-10 w-full min-w-0"
              />
            </label>
            <label className="block text-xs text-muted">
              Bitiş tarihi
              <Input
                variant="subtle"
                type="date"
                value={filters.dateTo ?? ''}
                onChange={(e) => onChange('dateTo', e.target.value)}
                aria-invalid={Boolean(invalidRange)}
                aria-describedby={
                  invalidRange ? `${id}-date-error` : `${id}-date-help`
                }
                className="mt-1 min-h-10 w-full min-w-0"
              />
            </label>
            <p id={`${id}-date-help`} className="text-[11px] text-muted">
              Paylaşım tarihi; bitiş günü dahil.
            </p>
            {invalidRange && (
              <p
                id={`${id}-date-error`}
                role="alert"
                className="text-xs text-danger"
              >
                Bitiş tarihi başlangıçtan önce olamaz.
              </p>
            )}
          </div>
          <fieldset>
            <legend className="mb-1 text-xs text-muted">Medya</legend>
            {[
              ['all', 'Tümü'],
              ['with-media', 'Görsel içeren'],
              ['text-only', 'Görselsiz'],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex min-h-10 cursor-pointer items-center gap-2 text-[13px] text-text"
              >
                <input
                  type="radio"
                  name={`${id}-media`}
                  value={value}
                  checked={(filters.media ?? 'all') === value}
                  onChange={() => onChange('media', value)}
                  className="accent-accent"
                />
                {label}
              </label>
            ))}
          </fieldset>
          <label className="block text-xs text-muted">
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
      )}
      {(open || hasFilters) && (
        <div className="mt-2 px-1">
          <div className="flex min-h-10 items-center justify-between gap-1">
            <span role="status" className="text-xs tabular-nums text-muted">
              {resultCount} {resultLabel}
            </span>
            <button
              type="button"
              disabled={!hasFilters}
              onClick={onReset}
              className="min-h-10 rounded-lg px-2 text-xs text-accent hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40"
            >
              Aramayı temizle
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted">
            Yüklü kayıtlarda arama yapılır.
          </p>
        </div>
      )}
    </div>
  );
}
