import { render, screen } from '@testing-library/react';
import { DataCard } from '@/components/dna/DataCard';
import { describe, it, expect } from 'vitest';

describe('DataCard', () => {
  it('renders children content', () => {
    render(
      <DataCard>
        <p>Card content</p>
      </DataCard>,
    );
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('shows title when provided', () => {
    render(
      <DataCard title="Revenue">
        <p>Data</p>
      </DataCard>,
    );
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('does not render title header when no title or dotColor', () => {
    const { container } = render(
      <DataCard>
        <p>Data</p>
      </DataCard>,
    );
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  it('applies noShadow class when noShadow is true', () => {
    const { container } = render(
      <DataCard noShadow>
        <p>Data</p>
      </DataCard>,
    );
    expect(container.firstChild).not.toHaveClass('shadow-card');
  });

  it('applies shadow class by default', () => {
    const { container } = render(
      <DataCard>
        <p>Data</p>
      </DataCard>,
    );
    expect(container.firstChild).toHaveClass('shadow-card');
  });

  it('applies custom className', () => {
    const { container } = render(
      <DataCard className="custom-class">
        <p>Data</p>
      </DataCard>,
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders dot when dotColor is provided', () => {
    const { container } = render(
      <DataCard dotColor="bg-green-500">
        <p>Data</p>
      </DataCard>,
    );
    expect(container.querySelector('.status-dot')).toBeInTheDocument();
  });
});
