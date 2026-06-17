import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false, error: null }),
  useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/layout/DashboardShell', () => ({
  DashboardShell: ({ children }: any) => <div data-testid="shell">{children}</div>,
}));

vi.mock('@/components/dna', () => ({
  StatCard: ({ label, value }: any) => <div data-testid="stat-card">{label}: {value}</div>,
  DnaBadge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  DnaButton: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  TableWrapper: ({ children }: any) => <div data-testid="table-wrapper">{children}</div>,
}));

import WorkOrdersPage from '@/app/(dashboard)/production/work-orders/page';

describe('Work Orders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page without crashing', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByTestId('shell')).toBeDefined();
  });

  it('shows empty state when no work orders', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByText(/No Work Orders Active/i)).toBeDefined();
  });

  it('renders stat cards', () => {
    render(<WorkOrdersPage />);
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBeGreaterThanOrEqual(4);
  });
});
