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
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2 rounded-full border border-line bg-white/70 px-4 py-2 text-text backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] animate-[bar-in_var(--dur-base)_var(--ease-out)]">
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
