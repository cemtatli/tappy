import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../src/page/components/ui/DropdownMenu.jsx';

function Demo({ onPick }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Menüyü aç">Aç</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => onPick('a')}>
          Seçenek A
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onPick('b')}>
          Seçenek B
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu', () => {
  it('shows items when trigger is clicked and calls handler when item is clicked', async () => {
    const onPick = vi.fn();
    render(<Demo onPick={onPick} />);
    expect(screen.queryByText('Seçenek A')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Menüyü aç' }));
    const item = await screen.findByText('Seçenek A');
    fireEvent.click(item);
    expect(onPick).toHaveBeenCalledWith('a');
  });
});
