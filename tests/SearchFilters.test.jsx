import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchFilters } from '../src/page/components/SearchFilters.jsx';
import { EMPTY_FILTERS } from '../src/shared/filters.js';

function Harness() {
  const [filters, setFilters] = useState({
    ...EMPTY_FILTERS,
    search: 'design',
  });
  return (
    <SearchFilters
      filters={filters}
      onChange={(key, value) =>
        setFilters((current) => ({ ...current, [key]: value }))
      }
      onReset={() => setFilters({ ...EMPTY_FILTERS })}
      resultCount={12}
    />
  );
}

describe('SearchFilters', () => {
  it('retains active filters when collapsed and clears all search criteria', () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Gelişmiş arama' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText('Yazar'), {
      target: { value: '@alice' },
    });
    fireEvent.click(screen.getByLabelText('Görselsiz'));
    fireEvent.change(screen.getByLabelText('Minimum beğeni'), {
      target: { value: '50' },
    });
    expect(trigger.textContent).toContain('3');
    fireEvent.click(trigger);
    expect(screen.queryByLabelText('Yazar')).toBeNull();
    expect(screen.getByRole('status').textContent).toBe('12 bookmark');
    fireEvent.click(screen.getByRole('button', { name: 'Aramayı temizle' }));
    fireEvent.click(trigger);
    expect(screen.getByLabelText('Yazar').value).toBe('');
    expect(screen.getByLabelText('Tümü').checked).toBe(true);
    expect(screen.getByLabelText('Minimum beğeni').value).toBe('');
    expect(
      screen.getByRole('button', { name: 'Aramayı temizle' }).disabled
    ).toBe(true);
  });

  it('explains reversed date ranges and marks both inputs invalid', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Gelişmiş arama' }));
    fireEvent.change(screen.getByLabelText('Başlangıç tarihi'), {
      target: { value: '2026-07-04' },
    });
    fireEvent.change(screen.getByLabelText('Bitiş tarihi'), {
      target: { value: '2026-07-01' },
    });
    expect(screen.getByRole('alert').textContent).toContain(
      'başlangıçtan önce'
    );
    expect(
      screen.getByLabelText('Bitiş tarihi').getAttribute('aria-invalid')
    ).toBe('true');
    fireEvent.change(screen.getByLabelText('Bitiş tarihi'), {
      target: { value: '2026-07-04' },
    });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
