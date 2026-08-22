import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogClose,
} from '../src/page/components/ui/AlertDialog.jsx';

describe('AlertDialog', () => {
  it('shows content when open and calls onOpenChange(false) when Close is clicked', () => {
    const onOpenChange = vi.fn();
    render(
      <AlertDialog open onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogTitle>Kategoriyi sil</AlertDialogTitle>
          <AlertDialogDescription>Emin misin?</AlertDialogDescription>
          <AlertDialogClose>Vazgeç</AlertDialogClose>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.getByText('Kategoriyi sil')).toBeTruthy();
    fireEvent.click(screen.getByText('Vazgeç'));
    expect(onOpenChange).toHaveBeenCalled();
    expect(onOpenChange.mock.calls[0][0]).toBe(false);
  });

  it('does not render content when not open', () => {
    render(
      <AlertDialog open={false} onOpenChange={() => {}}>
        <AlertDialogContent>
          <AlertDialogTitle>Gizli</AlertDialogTitle>
        </AlertDialogContent>
      </AlertDialog>
    );
    expect(screen.queryByText('Gizli')).toBeNull();
  });
});
