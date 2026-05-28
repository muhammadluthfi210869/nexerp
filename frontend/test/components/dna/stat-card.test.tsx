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
