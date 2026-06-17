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

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue({ get: vi.fn().mockReturnValue(null) }),
  useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

vi.mock('@/components/layout/DashboardShell', () => ({
  DashboardShell: ({ children }: any) => <div data-testid="shell">{children}</div>,
}));

vi.mock('@/components/dna', () => ({
  StatCard: ({ label, value }: any) => <div data-testid="stat-card">{label}: {value}</div>,
  DnaBadge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  DataCard: ({ children }: any) => <div data-testid="data-card">{children}</div>,
  TableWrapper: ({ children }: any) => <div data-testid="table-wrapper">{children}</div>,
}));

import OperationsPage from '@/app/(dashboard)/production/operations/page';

describe('Operations Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page without crashing', () => {
    render(<OperationsPage />);
    expect(screen.getByTestId('shell')).toBeDefined();
  });

  it('renders tab navigation', () => {
    render(<OperationsPage />);
    expect(screen.getByText('Work Orders')).toBeDefined();
    expect(screen.getByText('Mixing')).toBeDefined();
    expect(screen.getByText('Filling')).toBeDefined();
    expect(screen.getByText('Packing')).toBeDefined();
  });

  it('renders stat cards', () => {
    render(<OperationsPage />);
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBeGreaterThanOrEqual(3);
  });
});
