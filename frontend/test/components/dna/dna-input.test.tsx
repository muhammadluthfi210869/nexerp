import { render, screen, fireEvent } from '@testing-library/react';
import { DnaInput } from '@/components/dna/DnaInput';
import { describe, it, expect, vi } from 'vitest';

describe('DnaInput', () => {
  it('renders with placeholder', () => {
    render(<DnaInput placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('renders with a value', () => {
    render(<DnaInput value="test value" readOnly />);
    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('handles value changes', () => {
    const handleChange = vi.fn();
    render(<DnaInput onChange={handleChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with icon when provided', () => {
    render(<DnaInput icon={<span data-testid="icon">🔍</span>} placeholder="Search" />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<DnaInput className="custom-input" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('is disabled when disabled prop is set', () => {
    render(<DnaInput disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
