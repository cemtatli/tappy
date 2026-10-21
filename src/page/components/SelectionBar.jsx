import { Button } from './ui/Button.jsx';

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
    <div className="fixed bottom-24 left-1/2 z-40 flex max-w-[calc(100vw-32px)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border border-line/80 bg-white/80 px-4 py-2 text-text shadow-[0_1px_2px_rgba(28,27,24,0.04),0_14px_40px_-20px_rgba(28,27,24,0.4)] backdrop-blur-xl animate-[bar-center-in_var(--dur-base)_var(--ease-out)]">
      <span className="text-sm">{statusText ?? `${count} seçili`}</span>
      {onBulkAddToCollection && (
        <Button variant="ghost" size="sm" onClick={onBulkAddToCollection}>
          Koleksiyona ekle
        </Button>
      )}
      {onBulkFigmaExport && (
        <Button variant="ghost" size="sm" onClick={onBulkFigmaExport}>
          Figma&apos;ya aktar
        </Button>
      )}
      {onBulkExportJson && (
        <Button variant="ghost" size="sm" onClick={onBulkExportJson}>
          JSON export
        </Button>
      )}
      {onBulkExportCsv && (
        <Button variant="ghost" size="sm" onClick={onBulkExportCsv}>
          CSV export
        </Button>
      )}
      {onBulkUnmark && (
        <Button variant="destructive" size="sm" onClick={onBulkUnmark}>
          Unmark
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onClear}>
        Vazgeç
      </Button>
    </div>
  );
}
