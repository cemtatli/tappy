// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastStack } from '../src/page/components/ToastStack.jsx';

describe('ToastStack', () => {
  it('renders nothing when there are no toasts', () => {
    const { container } = render(
      <ToastStack toasts={[]} onDismiss={() => {}} />
    );
    expect(container.textContent).toBe('');
  });

  it('renders each toast message', () => {
    render(
      <ToastStack
        toasts={[
          { id: 1, type: 'success', message: 'Favorilere eklendi' },
          { id: 2, type: 'error', message: 'Senkron hatası' },
        ]}
        onDismiss={() => {}}
      />
    );
    expect(screen.getByText('Favorilere eklendi')).toBeTruthy();
    expect(screen.getByText('Senkron hatası')).toBeTruthy();
  });

  it('calls onDismiss with the toast id when clicked', () => {
    const onDismiss = vi.fn();
    render(
      <ToastStack
        toasts={[{ id: 7, type: 'info', message: 'Bilgi' }]}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByText('Bilgi'));
    expect(onDismiss).toHaveBeenCalledWith(7);
  });
});
