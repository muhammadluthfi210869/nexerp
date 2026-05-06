import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/empty-state';
import { Package } from 'lucide-react';
import { describe, it, expect } from 'vitest';

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(<EmptyState title="No data" description="Nothing to show" />);
    expect(screen.getByText('No data')).toBeInTheDocument();
    expect(screen.getByText('Nothing to show')).toBeInTheDocument();
  });

  it('renders with custom icon', () => {
    render(<EmptyState icon={Package} title="Empty" description="No items" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    render(
      <EmptyState
        title="No items"
        description="Create one"
        action={<button>Add New</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Add New' })).toBeInTheDocument();
  });
});
