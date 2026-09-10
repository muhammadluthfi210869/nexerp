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

vi.mock('@/components/dna', async (importOriginal) => {
  const mod = await importOriginal<any>();
  const Dummy = (props: any) => <>{props?.children}</>;
  const stub: any = {
    useDnaToast: () => ({ toast: () => {}, success: () => {}, error: () => {} }),
  };
  for (const key of Object.keys(mod)) {
    if (!stub[key]) stub[key] = Dummy;
  }
  return stub;
});

vi.mock('@/components/layout/DashboardShell', async () => {
  const mod = await import('@/components/layout/DashboardShell');
  return {
    ...mod,
    default: ({ children }: any) => <div data-testid="shell">{children}</div>,
  };
});

import WorkOrdersPage from '@/app/(dashboard)/production/work-orders/page';

describe('Work Orders Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('renders the page without crashing', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByTestId('shell')).toBeDefined();
  });

  it.skip('shows empty state when no work orders', () => {
    render(<WorkOrdersPage />);
    expect(screen.getByText(/No Work Orders Active/i)).toBeDefined();
  });

  it.skip('renders stat cards', () => {
    render(<WorkOrdersPage />);
    const statCards = screen.getAllByTestId('stat-card');
    expect(statCards.length).toBeGreaterThanOrEqual(4);
  });
});
