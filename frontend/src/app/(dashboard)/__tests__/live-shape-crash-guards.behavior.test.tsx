/**
 * Three pages the browser sweep found dead on 2026-09-26, each because a live
 * endpoint answered 200 with a body the page cannot draw:
 *
 * 1. `/dashboard` read `/dashboards/marketing`, which returns `{data:{cards,freshness}}`
 *    — no `acquisition` block — and dereferenced `audit.acquisition.revenue_mtd`. The
 *    page's fallback only ran on a *thrown* request, so a 200 with the wrong shape
 *    killed it: "Cannot read properties of undefined (reading 'revenue_mtd')".
 * 2. `/finance/taxes` got `rate` as a JSON string (`"11"`, `"0.5"` — Prisma Decimal
 *    over the wire) and called `t.rate.toFixed(2)`: "e.rate.toFixed is not a function".
 * 3. `/reports/finance-reports` called `/reports/general-ledger`, which answers
 *    `{"data":[]}` — no `account` — while the panel draws `ledgerData.account.name`.
 *    Every tab mounts at once, so that one crash took Laba Rugi, Neraca and Neraca
 *    Saldo down with it: "Cannot read properties of undefined (reading 'name')".
 *
 * The payloads below are verbatim from the live server, so none of the three can
 * come back without a red run here.
 */
import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/dna", async () => {
  const actual = await vi.importActual<typeof import("@/components/dna")>("@/components/dna");
  return {
    ...actual,
    useDnaToast: () => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }),
  };
});

// framer-motion's AnimatePresence keeps its own timers; the pages only use it for
// fade-in, so a passthrough keeps the assertions about data, not animation.
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<any>("framer-motion");
  return {
    ...actual,
    motion: new Proxy({}, { get: () => ({ children }: any) => <div>{children}</div> }),
    AnimatePresence: ({ children }: any) => <div>{children}</div>,
  };
});

import { api } from "@/lib/api";
import DashboardPage from "@/app/(dashboard)/dashboard/page";
import FinanceTaxesPage from "@/app/(dashboard)/finance/taxes/page";
import FinanceReportsPage from "@/app/(dashboard)/reports/finance-reports/page";

type Reply = { status: number; body: unknown };
let reply: (url: string, method?: string) => Promise<Reply>;
const calls: string[] = [];
let originalAdapter: unknown;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("pages survive the shapes the live endpoints actually send", () => {
  beforeAll(() => {
    originalAdapter = api.defaults.adapter;
    api.defaults.adapter = async (config: any) => {
      const url = String(config.url ?? "");
      const method = String(config.method ?? "get").toLowerCase();
      calls.push(`${method.toUpperCase()} ${url}`);
      const { status, body } = await reply(url, method);
      const response = { data: body, status, statusText: String(status), headers: {}, config };
      if (status >= 400) {
        throw new AxiosError(`Request failed with status ${status}`, String(status), config, {}, response as any);
      }
      return response as any;
    };
  });

  afterAll(() => {
    api.defaults.adapter = originalAdapter as any;
  });

  beforeEach(() => {
    calls.length = 0;
    reply = async () => ({ status: 200, body: [] });
  });

  it("/dashboard renders when /dashboards/marketing answers 200 with no acquisition block", async () => {
    // Verbatim from `GET /v1/dashboards/marketing` (2026-09-26).
    const marketingCardCounts = {
      data: {
        cards: { activeCampaigns: 0, contentAssets: 0 },
        freshness: { generated_at: "2026-09-26T10:18:39.695Z", sla_seconds: 300 },
      },
    };
    // Verbatim shape from `GET /v1/analytics/executive` (2026-09-26), trimmed to one
    // trend row: every key the page maps over is present, because a missing array is
    // its own crash ("Cannot read properties of undefined (reading 'map')").
    const executiveAudit = {
      acquisition: { revenue_mtd: 0, target: 350000000, deal_count: 806, avg_cpa: 0 },
      funnel: { leads: 806, qualified: 644, samples: 0, closing_rate: 100 },
      budget: { total_spend: 0, budget_limit: 150000000, cpl: 0, cost_per_sample: 0 },
      trends: [{ date: "2026-08-26", leads: 0, cpl: 0, spend: 0 }],
      content: [],
      vitality: { followers: 0, growth: 0, total_reach: 0, profile_visits: 0, total_likes: 0, total_comments: 0, total_shares: 0, total_saves: 0 },
      platform_audit: [],
      lead_ranking: [{ source: "LEGACY_KIL_IMPORT", count: 806 }],
    };

    reply = async (url) => {
      if (url.includes("/dashboards/marketing")) return { status: 200, body: marketingCardCounts };
      if (url.includes("/analytics/executive")) return { status: 200, body: executiveAudit };
      return { status: 200, body: [] };
    };

    renderWithClient(<DashboardPage />);

    // `audit.acquisition.revenue_mtd` threw here on the card-counts payload.
    // waitFor defaults to 1s whatever `testTimeout` says, and this page mounts its
    // charts after the audit query settles, so give it room.
    await waitFor(
      () => {
        expect(screen.getByText(/ACQUISITION HUB/i)).toBeDefined();
      },
      { timeout: 5000 },
    );
    expect(document.body.textContent).not.toContain("undefined");
  });

  it("/finance/taxes renders a rate that arrives as a string", async () => {
    // Verbatim from `GET /v1/finance/taxes` (2026-09-26): `rate` is a string.
    const liveTaxRates = [
      { id: "54c6ef19-b4ff-4a26-b410-7580c4dcb7cf", name: "PPN 11%", rate: "11", isActive: true, description: "Pajak Pertambahan Nilai Standar" },
      { id: "34a4f298-614b-40af-b02b-938fbb143ad9", name: "PPh 4(2) Final 0.5%", rate: "0.5", isActive: true, description: "Pajak Final UMKM" },
    ];

    reply = async (url) => {
      if (url.includes("/finance/taxes")) return { status: 200, body: liveTaxRates };
      if (url.includes("/finance/dashboard")) return { status: 200, body: { metrics: {} } };
      return { status: 200, body: [] };
    };

    renderWithClient(<FinanceTaxesPage />);

    // `t.rate.toFixed(2)` threw on "11".
    await waitFor(
      () => {
        expect(screen.getByText("11.00%")).toBeDefined();
      },
      { timeout: 5000 },
    );
    expect(screen.getByText("0.50%")).toBeDefined();
    expect(document.body.textContent).not.toContain("NaN");
  });

  it("/reports/finance-reports renders the ledger when /reports/general-ledger sends no account", async () => {
    const accounts = [
      { id: "2dfd4372-7347-4853-81d9-162b8b66b22d", code: "1100", name: "Kas & Bank", type: "ASSET", normalBalance: "DEBIT", isActive: true },
    ];
    // Verbatim from `GET /v1/reports/general-ledger?coa_id=...` (2026-09-26): a 200
    // with no `account`, which the panel dereferences.
    const reportsLedger = { data: [] };
    // Verbatim from `GET /v1/finance/reports/general-ledger/:id` — the shape the panel draws.
    const financeLedger = {
      account: { code: "1100", name: "Kas & Bank (Aset Lancar)", normalBalance: "DEBIT" },
      period: { startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-12-31T00:00:00.000Z" },
      beginningBalance: 0,
      transactions: [],
      endingBalance: 0,
    };

    reply = async (url) => {
      if (url.includes("/finance/accounts")) return { status: 200, body: accounts };
      if (url.includes("/reports/general-ledger/")) return { status: 200, body: financeLedger };
      if (url.includes("/reports/general-ledger")) return { status: 200, body: reportsLedger };
      if (url.includes("/trial-balance/detailed")) return { status: 200, body: { data: [], totals: {}, isBalanced: true } };
      if (url.includes("/profit-loss"))
        return {
          status: 200,
          body: { operatingIncome: 0, netProfit: 0, operatingRevenue: { total: 0, groups: {} }, cogs: { total: 0, groups: {} }, operatingExpenses: { total: 0, groups: {} }, otherIncome: { total: 0, groups: {} } },
        };
      if (url.includes("/balance-sheet"))
        // `assets.items` is what `buildTree` walks; live sends `{items, total}` for
        // assets, liabilities and equity (verified 2026-09-26).
        return {
          status: 200,
          body: {
            assets: { items: [], total: 0 },
            liabilities: { items: [], total: 0 },
            equity: { items: [], total: 0 },
            totalLiabilitiesAndEquity: 0,
            isBalanced: true,
          },
        };
      if (url.includes("/budget-vs-actual")) return { status: 200, body: { rows: [] } };
      if (url.includes("/project-budgeting")) return { status: 200, body: { projects: [] } };
      return { status: 200, body: [] };
    };

    renderWithClient(<FinanceReportsPage />);

    // `ledgerData.account.name` threw on the `{data: []}` body. Two requests deep
    // (accounts, then the ledger), so 1s is not enough under load.
    await waitFor(
      () => {
        expect(screen.getByText(/Kas & Bank \(Aset Lancar\)/)).toBeDefined();
      },
      { timeout: 5000 },
    );
    expect(document.body.textContent).not.toContain("undefined");
  });
});
