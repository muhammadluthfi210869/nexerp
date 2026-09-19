import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Canonical screen imports
import MasterSuppliersPage from '@/app/(dashboard)/master/suppliers/page';
import MasterCustomersPage from '@/app/(dashboard)/master/customers/page';
import MasterMaterialsPage from '@/app/(dashboard)/master/materials/page';
import MasterWarehousesPage from '@/app/(dashboard)/master/warehouses/page';
import { PersonnelRegistry } from '@/app/(dashboard)/master/personnel/PersonnelRegistry';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn().mockReturnValue({
    get: vi.fn().mockReturnValue(null),
  }),
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
}

describe('Canonical P06 Master Screens — Behavioral Acceptance Tests', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = originalFetch;
  });

  describe('1. Master Suppliers Screen', () => {
    it('renders supplier data correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'sup-1',
              code: 'SUP-001',
              name: 'PT Aroma Sukses Mandiri',
              phone: '08123456789',
              city: 'Surabaya',
              status: 'ACTIVE',
            },
          ],
        },
      });

      renderWithClient(<MasterSuppliersPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Aroma Sukses Mandiri')).toBeInTheDocument();
      });
    });

    it('renders empty state when API returns []', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

      renderWithClient(<MasterSuppliersPage />);

      await waitFor(() => {
        expect(screen.getByText(/Tidak ada data supplier yang sesuai filter/i)).toBeInTheDocument();
      });
    });

    it('renders error state and recovers upon retry click', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Gagal memuat data supplier: network timeout'));

      renderWithClient(<MasterSuppliersPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gagal memuat data supplier: network timeout/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
      expect(retryBtn).toBeInTheDocument();

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'sup-2',
              code: 'SUP-002',
              name: 'PT Kimia Farma Recovered',
              phone: '08111111111',
              city: 'Jakarta',
              status: 'ACTIVE',
            },
          ],
        },
      });

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('PT Kimia Farma Recovered')).toBeInTheDocument();
      });
    });
  });

  describe('2. Master Customers Screen', () => {
    it('renders customer data correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'cust-1',
              code: 'CUST-001',
              name: 'PT Cantik Jelita',
              clientName: 'PT Cantik Jelita',
              brandName: 'Jelita Glow',
              phone: '08222222222',
              city: 'Surabaya',
              status: 'ACTIVE',
            },
          ],
        },
      });

      renderWithClient(<MasterCustomersPage />);

      await waitFor(() => {
        expect(screen.getByText('PT Cantik Jelita')).toBeInTheDocument();
      });
    });

    it('renders empty state when API returns []', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [],
        },
      });

      renderWithClient(<MasterCustomersPage />);

      await waitFor(() => {
        expect(screen.getByText(/Tidak ada data pelanggan yang sesuai filter/i)).toBeInTheDocument();
      });
    });

    it('renders error state and recovers upon retry click', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Failed to fetch customers'));

      renderWithClient(<MasterCustomersPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gagal memuat data pelanggan/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
      expect(retryBtn).toBeInTheDocument();

      vi.mocked(api.get).mockResolvedValueOnce({
        data: {
          data: [
            {
              id: 'cust-2',
              code: 'CUST-002',
              name: 'PT Mahkota Cantik',
              brandName: 'Mahkota Glow',
              phone: '08333333333',
              status: 'ACTIVE',
            },
          ],
        },
      });

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('PT Mahkota Cantik')).toBeInTheDocument();
      });
    });
  });

  describe('3. Master Materials Screen', () => {
    it('renders material data correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'mat-1',
            code: 'RAW-001',
            name: 'Niacinamide Pure',
            type: 'RAW_MATERIAL',
            unit: 'Kg',
            unitPrice: 250000,
            stockQty: 50,
            status: 'ACTIVE',
          },
        ],
      });

      renderWithClient(<MasterMaterialsPage />);

      await waitFor(() => {
        expect(screen.getByText('Niacinamide Pure')).toBeInTheDocument();
      });
    });

    it('renders empty state when API returns []', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
      });

      renderWithClient(<MasterMaterialsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Belum ada data material/i)).toBeInTheDocument();
      });
    });

    it('renders error state and recovers upon retry click', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Material API error'));

      renderWithClient(<MasterMaterialsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gagal memuat data material/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
      expect(retryBtn).toBeInTheDocument();

      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'mat-2',
            code: 'RAW-002',
            name: 'Glycerin Pharma',
            type: 'RAW_MATERIAL',
            unit: 'Kg',
            unitPrice: 45000,
            stockQty: 100,
            status: 'ACTIVE',
          },
        ],
      });

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Glycerin Pharma')).toBeInTheDocument();
      });
    });
  });

  describe('4. Master Warehouses Screen', () => {
    it('renders warehouse data correctly', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'wh-1',
            code: 'GDG-01',
            name: 'Gudang Bahan Baku Utama',
            location: 'Sidoarjo',
            phone: '031-123456',
            status: 'ACTIVE',
          },
        ],
      });

      renderWithClient(<MasterWarehousesPage />);

      await waitFor(() => {
        expect(screen.getByText('Gudang Bahan Baku Utama')).toBeInTheDocument();
      });
    });

    it('renders empty state when API returns []', async () => {
      vi.mocked(api.get).mockResolvedValueOnce({
        data: [],
      });

      renderWithClient(<MasterWarehousesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Tidak ada data gudang yang sesuai filter/i)).toBeInTheDocument();
      });
    });

    it('renders error state and recovers upon retry click', async () => {
      vi.mocked(api.get).mockRejectedValueOnce(new Error('Warehouse server failure'));

      renderWithClient(<MasterWarehousesPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gagal memuat data gudang/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
      expect(retryBtn).toBeInTheDocument();

      vi.mocked(api.get).mockResolvedValueOnce({
        data: [
          {
            id: 'wh-2',
            code: 'GDG-02',
            name: 'Gudang Kemasan Sekunder',
            location: 'Surabaya',
            phone: '031-987654',
            status: 'ACTIVE',
          },
        ],
      });

      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Gudang Kemasan Sekunder')).toBeInTheDocument();
      });
    });
  });

  describe('5. Master Personnel Screen', () => {
    it('renders personnel data correctly', async () => {
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (url.includes('/users')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'usr-1',
                email: 'budi@dreamlab.id',
                fullName: 'Budi Santoso',
                roles: ['Formulator'],
                status: 'ACTIVE',
              },
            ],
          };
        }
        return {
          ok: true,
          json: async () => [],
        };
      }) as any;

      renderWithClient(<PersonnelRegistry />);

      await waitFor(() => {
        expect(screen.getByText('Budi Santoso')).toBeInTheDocument();
      });
    });

    it('renders empty state when API returns []', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }) as any;

      renderWithClient(<PersonnelRegistry />);

      await waitFor(() => {
        expect(screen.getByText(/Tidak ada personel yang sesuai filter pencarian/i)).toBeInTheDocument();
      });
    });

    it('renders error state and recovers upon retry click', async () => {
      let fail = true;
      global.fetch = vi.fn().mockImplementation(async (url: string) => {
        if (fail) {
          return {
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
          };
        }
        if (url.includes('/users')) {
          return {
            ok: true,
            json: async () => [
              {
                id: 'usr-2',
                email: 'siti@dreamlab.id',
                fullName: 'Siti Rahma',
                roles: ['Operator'],
                status: 'ACTIVE',
              },
            ],
          };
        }
        return {
          ok: true,
          json: async () => [],
        };
      }) as any;

      renderWithClient(<PersonnelRegistry />);

      await waitFor(() => {
        expect(screen.getByText(/HTTP 500: Internal Server Error/i)).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole('button', { name: /Coba Lagi/i });
      expect(retryBtn).toBeInTheDocument();

      fail = false;
      fireEvent.click(retryBtn);

      await waitFor(() => {
        expect(screen.getByText('Siti Rahma')).toBeInTheDocument();
      });
    });
  });
});
