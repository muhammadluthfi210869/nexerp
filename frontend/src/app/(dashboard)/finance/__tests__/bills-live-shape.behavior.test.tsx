/**
 * Vendor-bill screens must render the rows `/finance/bills` actually sends.
 *
 * On 2026-09-26 the live endpoint answered 14 PAYABLE invoice rows whose
 * `vendorName` was `null` on every one of them (the invoice has no supplier
 * linked). `bills/page.tsx` mapped that straight to `vendor` and then filtered
 * with `b.vendor.toLowerCase()` during render — so the screen threw
 * `Cannot read properties of null (reading 'toLowerCase')` before it drew a
 * single row, for every user, on every load. The same endpoint also sent no
 * `totalAmount`, so the amount column rendered NaN.
 *
 * This suite renders the real page against the real response shape (captured
 * from the live server) so neither can come back.
 */
import { describe, it, expect, vi, beforeEach, afterAll, beforeAll } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

vi.mock("next/navigation", () => ({
  usePathname: () => "/finance/bills",
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
import VendorBillsPage from "@/app/(dashboard)/finance/bills/page";

// Verbatim from `GET /v1/finance/bills` (2026-09-26): the invoice-ledger shape,
// with the alias fields the mapper adds. `vendorName` is null because the row's
// `supplierId` is null — that is the live case, not a degraded one.
const LIVE_ROW = {
  id: "f0e92b10-c23f-465a-99c7-b5c1137a73da",
  invoiceNumber: "FP-2609-034",
  billNumber: "FP-2609-034",
  category: "PAYABLE",
  type: "FINAL_PAYMENT",
  status: "UNPAID",
  amountDue: "3000000",
  outstandingAmount: "3000000",
  totalAmount: 3000000,
  paidAmount: 0,
  remaining: 3000000,
  issuedAt: "2026-09-25T07:26:02.672Z",
  dueDate: "2026-10-25T07:26:02.632Z",
  createdAt: "2026-09-25T07:26:02.672Z",
  supplierId: null,
  supplier: null,
  vendorName: null,
  customerName: null,
};

type Reply = { status: number; body: unknown };
let reply: (url: string, method?: string, data?: any) => Promise<Reply>;
const calls: string[] = [];
let originalAdapter: unknown;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("Vendor bills screen — live /finance/bills shape", () => {
  beforeAll(() => {
    originalAdapter = api.defaults.adapter;
    api.defaults.adapter = async (config: any) => {
      const url = String(config.url ?? "");
      const method = String(config.method ?? "get").toLowerCase();
      calls.push(`${method.toUpperCase()} ${url}`);
      const { status, body } = await reply(url, method, config.data);
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

  it("renders a row whose vendorName is null instead of throwing", async () => {
    reply = async (url) => {
      if (url.includes("/finance/bills")) return { status: 200, body: [LIVE_ROW] };
      return { status: 200, body: [] };
    };

    renderWithClient(<VendorBillsPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/finance/bills"))).toBe(true);
    });

    // A null vendor used to abort the render pass before any row was drawn.
    await waitFor(() => {
      expect(screen.getAllByText("FP-2609-034").length).toBeGreaterThan(0);
    });
  });

  it("shows the bill amount in rupiah, never NaN", async () => {
    reply = async (url) => {
      if (url.includes("/finance/bills")) return { status: 200, body: [LIVE_ROW] };
      return { status: 200, body: [] };
    };

    renderWithClient(<VendorBillsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("FP-2609-034").length).toBeGreaterThan(0);
    });

    expect(document.body.textContent).not.toContain("NaN");
  });

  it("survives a search for a vendor name, which the search box invites", async () => {
    reply = async (url) => {
      if (url.includes("/finance/bills")) return { status: 200, body: [LIVE_ROW] };
      return { status: 200, body: [] };
    };

    renderWithClient(<VendorBillsPage />);

    await waitFor(() => {
      expect(screen.getAllByText("FP-2609-034").length).toBeGreaterThan(0);
    });

    // The placeholder is "Cari No Tagihan, Nama Vendor Supplier...". With an empty
    // term `b.id.toLowerCase().includes("")` is true, so `|| b.vendor.toLowerCase()`
    // is short-circuited and the null vendor never got touched. Typing anything the
    // bill number does not contain reaches it — and threw, unmounting the screen.
    const search = screen.getByPlaceholderText(/Nama Vendor Supplier/i);
    fireEvent.change(search, { target: { value: "kimia" } });

    // The page must still be standing, with its filter applied honestly.
    expect(screen.getByText(/Tagihan Supplier/)).toBeDefined();
    expect(document.body.textContent).not.toContain("NaN");
  });
});
