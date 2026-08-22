import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/page/components/ui/Button.jsx';

describe('Button', () => {
  it('renders children and forwards clicks', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Kaydet</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies variant classes', () => {
    render(<Button variant="destructive">Sil</Button>);
    expect(screen.getByRole('button').className).toContain('bg-danger');
  });

  it('merges extra className', () => {
    render(<Button className="w-full">A</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });
});
