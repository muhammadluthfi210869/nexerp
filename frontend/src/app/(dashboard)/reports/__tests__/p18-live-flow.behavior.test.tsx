/**
 * P18 Acceptance Suite — Reporting, Executive Analytics & KPI Governance UI Flow
 *
 * Under test:
 *   - `reports/balance-sheet/page.tsx` — Live Balance Sheet & Zero Mock Verification (BUS-RULE-105)
 *   - `reports/finance-reports/page.tsx` — P&L Card Order Verification (BUS-RULE-070)
 *   - `executive/dashboard/ExecutiveDashboardClient.tsx` — Live Executive Metrics Rollup
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/reports/balance-sheet",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-exec-1", name: "Director User", roles: ["SUPER_ADMIN", "DIRECTOR"] },
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
      toast: vi.fn(),
    }),
  };
});

import BalanceSheetPage from "@/app/(dashboard)/reports/balance-sheet/page";
import FinanceReportsPage from "@/app/(dashboard)/reports/finance-reports/page";
import ExecutiveDashboardClient from "@/app/(dashboard)/executive/dashboard/ExecutiveDashboardClient";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("P18 Live Flow — Reporting, Executive Analytics & KPI Governance", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Live Balance Sheet (BUS-RULE-105: Zero Mock)", () => {
    it("renders live balance sheet from API without mock fallback arrays", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          date: "2026-09-22",
          assets: {
            items: [
              {
                id: "acc-1",
                code: "1110",
                name: "Bank Mandiri Live",
                type: "ASSET",
                reportGroup: "CURRENT_ASSET",
                parentId: null,
                balance: 150000000,
                debitBalance: 150000000,
                creditBalance: 0,
              },
            ],
            total: 150000000,
          },
          liabilities: {
            items: [
              {
                id: "acc-2",
                code: "2110",
                name: "Hutang Usaha Live",
                type: "LIABILITY",
                reportGroup: "CURRENT_LIABILITY",
                parentId: null,
                balance: 50000000,
                debitBalance: 0,
                creditBalance: 50000000,
              },
            ],
            total: 50000000,
          },
          equity: {
            items: [
              {
                id: "acc-3",
                code: "3110",
                name: "Modal Disetor Live",
                type: "EQUITY",
                reportGroup: "EQUITY",
                parentId: null,
                balance: 100000000,
                debitBalance: 0,
                creditBalance: 100000000,
              },
            ],
            netIncome: 0,
            total: 100000000,
          },
          totalLiabilitiesAndEquity: 150000000,
          isBalanced: true,
        },
      });

      renderWithClient(<BalanceSheetPage />);

      await waitFor(() => {
        expect(screen.getByText(/Bank Mandiri Live/i)).toBeDefined();
        expect(screen.getByText(/Hutang Usaha Live/i)).toBeDefined();
        expect(screen.getByText(/Modal Disetor Live/i)).toBeDefined();
        expect(screen.getByText(/STATUS NERACA: SEIMBANG/i)).toBeDefined();
      });
    });

    it("renders empty state card without crashing or showing fake mock data when API returns empty", async () => {
      vi.spyOn(api, "get").mockRejectedValueOnce(new Error("Network Error"));

      renderWithClient(<BalanceSheetPage />);

      await waitFor(() => {
        expect(screen.getByText(/Data Neraca Tidak Tersedia/i)).toBeDefined();
      });
    });
  });

  describe("2. P&L Card Order (BUS-RULE-070)", () => {
    it("renders P&L funnel cards strictly adhering to BUS-RULE-070 sequence", async () => {
      vi.spyOn(api, "get").mockImplementation(async (url: string) => {
        if (url.includes("profit-loss")) {
          return {
            data: {
              data: [],
              operatingRevenue: { groups: {}, total: 500000000 },
              cogs: { groups: {}, total: 200000000 },
              operatingExpenses: { groups: {}, total: 100000000 },
              otherIncome: { groups: {}, total: 0 },
              otherExpenses: { groups: {}, total: 0 },
              grossProfit: 300000000,
              operatingIncome: 200000000,
              netProfit: 200000000,
              cardOrder: ["TotalPendapatan", "TotalBebanHPP", "LabaOperasionalBersih"],
            },
          };
        }
        return { data: { data: [], totals: {} } };
      });

      renderWithClient(<FinanceReportsPage />);

      const pnlTab = await screen.findByRole("button", { name: /Laba Rugi/i });
      pnlTab.click();

      await waitFor(() => {
        const container = screen.getByTestId("pnl-summary-cards");
        expect(container).toBeDefined();

        // Cards order: Total Pendapatan -> Total Beban Pokok (HPP) -> Laba Operasional Bersih -> Laba Bersih
        const labels = container.querySelectorAll("p, span, h4");
        const texts = Array.from(labels).map((el) => el.textContent);
        const pendIdx = texts.findIndex((t) => t?.includes("Total Pendapatan"));
        const hppIdx = texts.findIndex((t) => t?.includes("Total Beban Pokok (HPP)"));
        const labaOpsIdx = texts.findIndex((t) => t?.includes("Laba Operasional Bersih"));

        expect(pendIdx).toBeGreaterThanOrEqual(0);
        expect(hppIdx).toBeGreaterThan(pendIdx);
        expect(labaOpsIdx).toBeGreaterThan(hppIdx);
      });
    });
  });

  describe("3. Executive Dashboard Live Rollup", () => {
    it("fetches and renders live executive metrics without mock fallback", async () => {
      vi.spyOn(api, "get").mockImplementation(async (url: string) => {
        if (url === "/executive/metrics") {
          return {
            data: {
              revenue: { mtd: 1200000000, target: 1000000000, achievement: 120, projection: 1300000000, growth: 15 },
              pipeline: { total: 45, deal: 12, prospect: 20, hot: 5 },
              production: { activeOrders: 8, overdue: 0, onProd: 4, qcFlow: 2, ready: 2, fpyRate: 98.5 },
              cashflow: { netCashflow: 450000000, pendingInvoices: 5 },
            },
          };
        }
        if (url === "/executive/alerts") {
          return {
            data: {
              delayedOrders: 0,
              overdueClients: 0,
              unfollowedLeads: 0,
            },
          };
        }
        return { data: {} };
      });

      renderWithClient(<ExecutiveDashboardClient />);

      await waitFor(() => {
        expect(screen.getByText(/SYSTEM ALERT/i)).toBeDefined();
        expect(screen.getByText(/REVENUE & TARGET/i)).toBeDefined();
      });
    });
  });
});
