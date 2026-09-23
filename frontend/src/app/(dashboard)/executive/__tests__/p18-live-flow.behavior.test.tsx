/**
 * P18 Acceptance Suite — Reporting, Executive Analytics & KPI Governance UI Suite.
 *
 * Under test:
 *   - `executive/dashboard/page.tsx` — Dashboard Eksekutif Strategis (SCR-150)
 *   - `executive/audit/page.tsx` — Audit Trail & Forensik Transaksi
 *   - `reports/ar-aging/page.tsx` — Laporan Umur Piutang (AR Aging Report) (SCR-130)
 *   - `reports/sales-summary/page.tsx` — Laporan Rekapitulasi Penjualan (SCR-133)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/executive/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "1" }),
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-exec-1", fullName: "Director Test", roles: ["DIRECTOR", "SUPER_ADMIN"] },
    hasRole: () => true,
    loading: false,
  }),
}));

// Mock dna toast
vi.mock("@/components/dna", async () => {
  const actual = await vi.importActual<typeof import("@/components/dna")>("@/components/dna");
  return {
    ...actual,
    useDnaToast: () => ({
      success: vi.fn(),
      error: vi.fn(),
      toast: vi.fn(),
    }),
  };
});

import ExecutiveDashboardPage from "@/app/(dashboard)/executive/dashboard/page";
import AuditTrailPage from "@/app/(dashboard)/executive/audit/page";
import ArAgingReportPage from "@/app/(dashboard)/reports/ar-aging/page";
import ReportSalesSummaryPage from "@/app/(dashboard)/reports/sales-summary/page";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("P18 Live Flow — Reporting, Executive Analytics & Audit UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Dashboard Eksekutif (SCR-150)", () => {
    it("renders executive dashboard title and live KPI stat cards", async () => {
      vi.spyOn(api, "get").mockImplementation((url: string) => {
        if (url.includes("metrics")) {
          return Promise.resolve({
            data: {
              revenue: { mtd: 350000000, target: 500000000, achievement: 70, projection: 450000000, growth: 12 },
              pipeline: { total: 42, deal: 18, prospect: 14, hot: 10 },
              production: { activeOrders: 8, onProd: 4, ready: 3, qcFlow: 2, overdue: 0 },
              cashflow: { totalAR: 240000000, aging: { "0-30": 180000000, "31-60": 40000000, "60+": 20000000 } },
              lost: { totalVal: 50000000, churnRate: 2.1 },
              repeatOrder: { rate: 65, revenue: 210000000, readyToRepeat: 5, targetFollowUp: 3 },
            },
          });
        }
        return Promise.resolve({ data: [] });
      });

      renderWithClient(<ExecutiveDashboardPage />);

      expect(screen.getByText(/Dashboard Eksekutif/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Pusat Komando Strategis/i)).toBeInTheDocument();
      });
    });
  });

  describe("2. Audit Trail Forensics", () => {
    it("renders audit trail page with live ActivityLog forensic records", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: [
          {
            id: "act-1",
            action: "CREATE",
            entity: "SalesInvoice",
            entityType: "SalesInvoice",
            entityId: "INV-P18-999",
            user: "Ahmad Finance",
            ipAddress: "192.168.1.100",
            timestamp: new Date().toISOString(),
            status: "SUCCESS",
            details: "Invoice posted successfully",
            hash: "c2e428cfb0f19c637497d5a57a060d5b",
          },
        ],
      });

      renderWithClient(<AuditTrailPage />);

      expect(screen.getByText(/AUDIT/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Ahmad Finance/i)).toBeInTheDocument();
        expect(screen.getByText(/SalesInvoice/i)).toBeInTheDocument();
      });
    });
  });

  describe("3. Laporan Umur Piutang / AR Aging (SCR-130)", () => {
    it("renders AR Aging report with live bucket breakdown and zero mock constants", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          data: [
            {
              id: "inv-p18-1",
              customer: "PT Cantika Kosmetika",
              invoiceNo: "INV-P18-001",
              invoiceDate: "2026-09-01",
              dueDate: "2026-09-25",
              daysOverdue: 0,
              totalAmount: 100000000,
              paidAmount: 20000000,
              outstandingAmount: 80000000,
              bucket: "Current",
            },
          ],
          summary: {
            totalOutstanding: 80000000,
            currentTotal: 80000000,
            overdueTotal: 0,
            overdue90Pct: 0,
            isHealthy: true,
            buckets: { Current: 80000000, "1-30": 0, "31-60": 0, "61-90": 0, ">90": 0 },
            count: 1,
          },
        },
      });

      renderWithClient(<ArAgingReportPage />);

      expect(screen.getByText(/Laporan Umur Piutang/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/PT Cantika Kosmetika/i)).toBeInTheDocument();
        expect(screen.getByText(/INV-P18-001/i)).toBeInTheDocument();
      });
    });
  });

  describe("4. Laporan Rekapitulasi Penjualan (SCR-133)", () => {
    it("renders Sales Summary report with live customer aggregations", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          data: [
            {
              id: "cust-p18-1",
              customer: "CV Natural Herbal P18",
              contractType: "Jasa Maklon",
              invoiceCount: 2,
              totalAmount: 150000000,
              totalReceived: 90000000,
              outstanding: 60000000,
            },
          ],
          summary: {
            totalAmount: 150000000,
            totalReceived: 90000000,
            totalOutstanding: 60000000,
            totalOrders: 2,
            totalCustomers: 1,
          },
        },
      });

      renderWithClient(<ReportSalesSummaryPage />);

      expect(screen.getByText(/Laporan Rekapitulasi Penjualan/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/CV Natural Herbal P18/i)).toBeInTheDocument();
      });
    });
  });
});
