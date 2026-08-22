// tests/SelectionBar.test.jsx
// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { SelectionBar } from '../src/page/components/SelectionBar.jsx';

afterEach(cleanup);

describe('SelectionBar', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<SelectionBar visible={false} count={0} />);
    expect(container.textContent).toBe('');
  });

  it('shows the selected count by default', () => {
    render(<SelectionBar visible count={3} />);
    expect(screen.getByText('3 seçili')).toBeTruthy();
  });

  it('shows statusText instead of count when provided', () => {
    render(
      <SelectionBar visible count={3} statusText="1/3 unmark ediliyor..." />
    );
    expect(screen.getByText('1/3 unmark ediliyor...')).toBeTruthy();
  });

  it('wires all four action buttons to their handlers', () => {
    const onBulkExportJson = vi.fn();
    const onBulkExportCsv = vi.fn();
    const onBulkUnmark = vi.fn();
    const onClear = vi.fn();
    render(
      <SelectionBar
        visible
        count={1}
        onBulkExportJson={onBulkExportJson}
        onBulkExportCsv={onBulkExportCsv}
        onBulkUnmark={onBulkUnmark}
        onClear={onClear}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'JSON export' }));
    fireEvent.click(screen.getByRole('button', { name: 'CSV export' }));
    fireEvent.click(screen.getByRole('button', { name: 'Unmark' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vazgeç' }));
    expect(onBulkExportJson).toHaveBeenCalledTimes(1);
    expect(onBulkExportCsv).toHaveBeenCalledTimes(1);
    expect(onBulkUnmark).toHaveBeenCalledTimes(1);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('calls onBulkAddToCollection when "Koleksiyona ekle" is clicked', () => {
    const onBulkAddToCollection = vi.fn();
    render(
      <SelectionBar
        visible
        count={2}
        onBulkAddToCollection={onBulkAddToCollection}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Koleksiyona ekle' }));
    expect(onBulkAddToCollection).toHaveBeenCalledTimes(1);
  });

  it('hides JSON/CSV/Unmark buttons when handlers are not provided', () => {
    render(<SelectionBar visible count={2} />);
    expect(screen.queryByRole('button', { name: 'JSON export' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'CSV export' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Unmark' })).toBeNull();
  });

  it('calls onBulkFigmaExport when "Figma\'ya aktar" is clicked', () => {
    const onBulkFigmaExport = vi.fn();
    render(
      <SelectionBar visible count={2} onBulkFigmaExport={onBulkFigmaExport} />
    );
    fireEvent.click(screen.getByRole('button', { name: "Figma'ya aktar" }));
    expect(onBulkFigmaExport).toHaveBeenCalledTimes(1);
  });

  it("hides Figma'ya aktar button when handler is not provided", () => {
    render(<SelectionBar visible count={2} />);
    expect(screen.queryByRole('button', { name: "Figma'ya aktar" })).toBeNull();
  });
});
