import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/dna/StatCard';
import { describe, it, expect } from 'vitest';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard label="Revenue" value="$1,200" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
  });

  it('renders subValue when provided', () => {
    render(<StatCard label="Revenue" value="$1,200" subValue="+12% from last month" />);
    expect(screen.getByText('+12% from last month')).toBeInTheDocument();
  });

  it('does not render subValue when not provided', () => {
    render(<StatCard label="Revenue" value="$1,200" />);
    expect(screen.queryByText(/from last month/)).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const icon = <svg data-testid="test-icon" />;
    render(<StatCard label="Revenue" value="$1,200" icon={icon} />);
    const icons = screen.getAllByTestId('test-icon');
    expect(icons.length).toBeGreaterThanOrEqual(1);
  });

  it('does not render icon when not provided', () => {
    render(<StatCard label="Revenue" value="$1,200" />);
    expect(screen.queryByRole('generic', { name: /test-icon/ })).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<StatCard label="Revenue" value="$1,200" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

import { DnaStatCard } from '@/components/dna/DnaStatCard';

describe('DnaStatCard', () => {
  it('renders label and value correctly', () => {
    render(<DnaStatCard label="Total Omset" value="Rp 120.000.000" subtext="Batch QC lolos" />);
    expect(screen.getByText('Total Omset')).toBeInTheDocument();
    expect(screen.getByText('Rp 120.000.000')).toBeInTheDocument();
    expect(screen.getByText('Batch QC lolos')).toBeInTheDocument();
  });

  it('handles semantic variants (primary, success, warning, danger) without crashing', () => {
    const { rerender, container } = render(
      <DnaStatCard label="Primary" value="10" variant="primary" />
    );
    expect(container.firstChild).toHaveClass('border-blue-100/80');

    rerender(<DnaStatCard label="Success" value="20" variant="success" />);
    expect(container.firstChild).toHaveClass('border-emerald-100/80');

    rerender(<DnaStatCard label="Warning" value="30" variant="warning" />);
    expect(container.firstChild).toHaveClass('border-amber-100/80');

    rerender(<DnaStatCard label="Danger" value="40" variant="danger" />);
    expect(container.firstChild).toHaveClass('border-rose-100/80');
  });

  it('safely falls back to neutral style on invalid or undefined variant', () => {
    // @ts-expect-error testing invalid variant at runtime
    const { container } = render(<DnaStatCard label="Unknown" value="0" variant="nonexistent" />);
    expect(container.firstChild).toHaveClass('border-slate-200');
  });
});

