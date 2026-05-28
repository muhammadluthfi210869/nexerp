import { render, screen, fireEvent } from '@testing-library/react';
import { DnaButton } from '@/components/dna/DnaButton';
import { describe, it, expect, vi } from 'vitest';

describe('DnaButton', () => {
  it('renders with children text', () => {
    render(<DnaButton variant="primary">Submit</DnaButton>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<DnaButton variant="primary" onClick={handleClick}>Click</DnaButton>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant styles', () => {
    render(<DnaButton variant="primary">Primary</DnaButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
  });

  it('applies secondary variant styles', () => {
    render(<DnaButton variant="secondary">Secondary</DnaButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-slate-800');
  });

  it('applies danger variant styles', () => {
    render(<DnaButton variant="danger">Danger</DnaButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-rose-50');
  });

  it('renders with icon when provided', () => {
    render(
      <DnaButton variant="primary" icon={<span data-testid="icon">★</span>}>
        With Icon
      </DnaButton>,
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('is disabled when disabled prop is set', () => {
    render(<DnaButton variant="primary" disabled>Disabled</DnaButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<DnaButton variant="primary" className="my-custom">Custom</DnaButton>);
    expect(screen.getByRole('button')).toHaveClass('my-custom');
  });
});
