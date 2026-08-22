import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../src/page/components/ui/Input.jsx';

describe('Input', () => {
  it('shows the value and fires a DOM onChange event', () => {
    const onChange = vi.fn();
    render(<Input aria-label="Ara" value="abc" onChange={onChange} />);
    const input = screen.getByLabelText('Ara');
    expect(input.value).toBe('abc');
    fireEvent.change(input, { target: { value: 'abcd' } });
    expect(onChange).toHaveBeenCalledOnce();
  });
});
