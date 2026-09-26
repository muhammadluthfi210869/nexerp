/**
 * Reproduction test — `finance/piutang` AR Hub tab renders fabricated invoices.
 *
 * Defect (found by the Fase 2 fabrication triage, 2026-09-25):
 *   `ARHubTab` performs NO fetch. It renders two hardcoded arrays —
 *   `STATIC_SALES_INVOICES` (line 585) and `STATIC_SAMPLE_INVOICES` (line 651) —
 *   so the "Penerimaan Piutang" surface shows five invented invoices, invented
 *   clients ("PT Maju Jaya", "CV Sejahtera"), invented totals and an invented
 *   status for every viewer, production included.
 *
 * The sibling tab `FakturJualTab` is already honest (`api.get("/finance/invoices")`),
 * so the live contract this surface must use already exists and is proven.
 * `STATIC_SAMPLE_INVOICES` additionally has NO backend source at all: there is no
 * samples-invoice endpoint, so it can only be replaced by an honest empty state.
 *
 * Per CLAUDE.md QA GATE this test must FAIL before the fix and pass after.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

vi.mock("next/navigation", () => ({
  usePathname: () => "/finance/piutang",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/dna", async () => {
  const actual = await vi.importActual<typeof import("@/components/dna")>("@/components/dna");
  return {
    ...actual,
    useDnaToast: () => ({
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

import { api } from "@/lib/api";
import PiutangPage from "@/app/(dashboard)/finance/piutang/page";

const PIUTANG_SRC = path.resolve(__dirname, "..", "piutang", "page.tsx");

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

const LIVE_INVOICE = {
  id: "inv-ar-hub-live-1",
  invoiceNumber: "INV-ARHUB-LIVE-001",
  category: "RECEIVABLE",
  type: "FINAL_PAYMENT",
  status: "PARTIAL",
  amountDue: 10000000,
  outstandingAmount: 4000000,
  issuedAt: "2026-09-01T00:00:00.000Z",
  dueDate: "2026-09-20T00:00:00.000Z",
  so: {
    orderNumber: "SO-ARHUB-LIVE-001",
    lead: { clientName: "PT Klien Nyata ARHub", brandName: "NyataBrand" },
  },
};

describe("finance/piutang — AR Hub must render live receivables, not static arrays", () => {
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

  it("source contains no STATIC_* invoice arrays", () => {
    const src = fs.readFileSync(PIUTANG_SRC, "utf-8");
    expect(src).not.toContain("const STATIC_SALES_INVOICES");
    expect(src).not.toContain("const STATIC_SAMPLE_INVOICES");
  });

  it("AR Hub renders the live receivable returned by /finance/invoices", async () => {
    reply = async (url) => {
      if (url.includes("/finance/invoices")) return { status: 200, body: [LIVE_INVOICE] };
      return { status: 200, body: [] };
    };

    renderWithClient(<PiutangPage />);

    // Open the AR Hub tab.
    const arHubTab = await screen.findByRole("button", { name: /AR Hub/i });
    arHubTab.click();

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/finance/invoices"))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText("INV-ARHUB-LIVE-001")).toBeDefined();
    });
  });

  it("AR Hub never shows the fabricated invoice identities", async () => {
    reply = async (url) => {
      if (url.includes("/finance/invoices")) return { status: 200, body: [LIVE_INVOICE] };
      return { status: 200, body: [] };
    };

    renderWithClient(<PiutangPage />);

    const arHubTab = await screen.findByRole("button", { name: /AR Hub/i });
    arHubTab.click();

    await waitFor(() => {
      expect(screen.getByText("INV-ARHUB-LIVE-001")).toBeDefined();
    });

    // Fabricated identities from the removed static arrays.
    for (const ghost of ["SI-001", "SI-005", "SSI-001", "PT Maju Jaya", "CV Sejahtera", "UD Sinar Jaya"]) {
      expect(screen.queryByText(ghost)).toBeNull();
    }
  });

  it("AR Hub reports an honest empty state when the API returns no receivables", async () => {
    reply = async (url) => {
      if (url.includes("/finance/invoices")) return { status: 200, body: [] };
      return { status: 200, body: [] };
    };

    renderWithClient(<PiutangPage />);

    const arHubTab = await screen.findByRole("button", { name: /AR Hub/i });
    arHubTab.click();

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/finance/invoices"))).toBe(true);
    });

    // The fabricated ledgers must not stand in for the missing data.
    expect(screen.queryByText("SI-001")).toBeNull();
    expect(screen.queryByText("SSI-001")).toBeNull();
  });
});