import { render, screen, fireEvent } from '@testing-library/react';
import { DnaBadge } from '@/components/dna/DnaBadge';
import { describe, it, expect, vi } from 'vitest';

describe('DnaBadge', () => {
  it('renders with correct text', () => {
    render(<DnaBadge>Active</DnaBadge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies default variant styles', () => {
    render(<DnaBadge>Default</DnaBadge>);
    expect(screen.getByText('Default')).toHaveClass('bg-slate-50');
  });

  it('applies success variant styles', () => {
    render(<DnaBadge status="success">Success</DnaBadge>);
    expect(screen.getByText('Success')).toHaveClass('bg-[#ECFDF5]');
  });

  it('applies warning variant styles', () => {
    render(<DnaBadge status="warning">Warning</DnaBadge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-amber-50');
  });

  it('applies critical variant styles', () => {
    render(<DnaBadge status="critical">Critical</DnaBadge>);
    expect(screen.getByText('Critical')).toHaveClass('bg-[#FEF2F2]');
  });

  it('applies info variant styles', () => {
    render(<DnaBadge status="info">Info</DnaBadge>);
    expect(screen.getByText('Info')).toHaveClass('bg-blue-50');
  });

  it('calls onClick when clicked and cursor-pointer is applied', () => {
    const handleClick = vi.fn();
    render(<DnaBadge onClick={handleClick}>Clickable</DnaBadge>);
    const badge = screen.getByText('Clickable');
    expect(badge).toHaveClass('cursor-pointer');
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    render(<DnaBadge className="custom-badge">Custom</DnaBadge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-badge');
  });
});
