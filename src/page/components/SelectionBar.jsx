import { Download, Frame, FolderPlus, Trash2, X } from 'lucide-react';
import { Button } from './ui/Button.jsx';

const ACTION = 'h-9 gap-1.5 px-3 text-[13px] font-medium';
const ICON = 15;

function Separator() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-black/[0.08]" />;
}

export function SelectionBar({
  visible,
  count,
  statusText,
  onBulkExportJson,
  onBulkExportCsv,
  onBulkUnmark,
  onBulkAddToCollection,
  onBulkFigmaExport,
  onClear,
}) {
  if (!visible) return null;
  return (
    <div
      role="toolbar"
      aria-label="Toplu işlemler"
      style={{ transform: 'translateX(-50%)' }}
      className="glass fixed bottom-5 left-1/2 z-40 flex h-12 max-w-[calc(100vw-32px)] items-center gap-0.5 overflow-x-auto rounded-full px-1.5 text-text animate-[bar-center-in_var(--dur-base)_var(--ease-out)]"
    >
      <Button
        variant="ghost"
        size="sm"
        aria-label="Vazgeç"
        title="Vazgeç"
        onClick={onClear}
        className="size-9 min-w-9 px-0"
      >
        <X size={ICON} />
      </Button>
      <span
        role="status"
        className="whitespace-nowrap pl-1 pr-2 text-[13px] font-semibold tabular-nums"
      >
        {statusText ?? `${count} seçili`}
      </span>
      <Separator />
      {onBulkAddToCollection && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Koleksiyona ekle"
          onClick={onBulkAddToCollection}
          className={ACTION}
        >
          <FolderPlus size={ICON} />
          Koleksiyon
        </Button>
      )}
      {onBulkFigmaExport && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Figma'ya aktar"
          onClick={onBulkFigmaExport}
          className={ACTION}
        >
          <Frame size={ICON} />
          Figma
        </Button>
      )}
      {onBulkExportJson && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="JSON export"
          onClick={onBulkExportJson}
          className={ACTION}
        >
          <Download size={ICON} />
          JSON
        </Button>
      )}
      {onBulkExportCsv && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="CSV export"
          onClick={onBulkExportCsv}
          className={ACTION}
        >
          <Download size={ICON} />
          CSV
        </Button>
      )}
      {onBulkUnmark && (
        <>
          <Separator />
          <Button
            variant="ghost"
            size="sm"
            aria-label="Unmark"
            title="Bookmark'tan kaldır"
            onClick={onBulkUnmark}
            className="size-9 min-w-9 px-0 text-danger hover:bg-danger/10"
          >
            <Trash2 size={ICON} />
          </Button>
        </>
      )}
    </div>
  );
}
