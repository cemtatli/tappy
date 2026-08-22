import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkbox } from '../src/page/components/ui/Checkbox.jsx';

describe('Checkbox', () => {
  it('calls onCheckedChange(true) when clicked while unchecked', () => {
    const onCheckedChange = vi.fn();
    render(
      <Checkbox
        aria-label="Sadece medyalı"
        checked={false}
        onCheckedChange={onCheckedChange}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sadece medyalı' }));
    expect(onCheckedChange).toHaveBeenCalled();
    expect(onCheckedChange.mock.calls[0][0]).toBe(true);
  });

  it('reflects checked state via aria-checked', () => {
    render(<Checkbox aria-label="X" checked onCheckedChange={() => {}} />);
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe(
      'true'
    );
  });
});
