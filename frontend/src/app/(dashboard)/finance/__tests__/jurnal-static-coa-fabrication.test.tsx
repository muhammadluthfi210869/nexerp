/**
 * Reproduction test — `finance/jurnal` Auto Journal tab labels COA mappings
 * from a hardcoded `STATIC_COA` literal.
 *
 * Defect (found by the Fase 2 fabrication triage, 2026-09-25):
 *   `STATIC_COA` (line 29) holds ten invented chart-of-accounts rows
 *   ("11111 Kas Utama", "11212 BCA (2640351589)", …). The Auto Journal tab
 *   resolves every mapping with `STATIC_COA.find(c => c.kode === val)` and
 *   renders `${kode} — ${nama}`. Consequences:
 *     1. the name shown for a code is whatever the literal says, which can
 *        disagree with the real account — including for ANY live account the
 *        literal does not list, which falls through to "— Not Set —" even
 *        though the mapping is set;
 *     2. the account name is invented, not read from the database.
 *
 * The honest source is the live chart of accounts the page ALREADY fetches:
 * `GET /finance/accounts` → `{ code, name }`. No new contract is needed.
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
  usePathname: () => "/finance/jurnal",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { api } from "@/lib/api";
import JurnalPage from "@/app/(dashboard)/finance/jurnal/page";

const JURNAL_SRC = path.resolve(__dirname, "..", "jurnal", "page.tsx");

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

/** The three mappings the page pre-seeds: coa_1 → "21111" is the ACCOUNT_PAYABLE rule. */
const MAPPED_CODE = "21111";

const LIVE_ACCOUNT = {
  id: "acc-live-1",
  code: MAPPED_CODE,
  name: "Hutang Dagang Live",
  type: "LIABILITY",
  isActive: true,
};

/** Invented names carried only by the removed `STATIC_COA` literal. */
const GHOST_COA_NAMES = [
  "Kas Utama",
  "Kas Kecil",
  "Modal Saham",
  "Beban Gaji",
  "Persediaan Bahan Baku",
];

describe("finance/jurnal — Auto Journal must not label COA from a static literal", () => {
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

  it("source contains no STATIC_COA array", () => {
    const src = fs.readFileSync(JURNAL_SRC, "utf-8");
    expect(src).not.toContain("const STATIC_COA");
  });

  it("labels the mapping from the live chart of accounts", async () => {
    reply = async (url) => {
      if (url.includes("/finance/accounts")) return { status: 200, body: [LIVE_ACCOUNT] };
      if (url.includes("/finance/journal")) return { status: 200, body: [] };
      if (url.includes("/finance/dashboard/advanced")) return { status: 200, body: { metrics: {} } };
      return { status: 200, body: [] };
    };

    renderWithClient(<JurnalPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/finance/accounts"))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText(`${MAPPED_CODE} — Hutang Dagang Live`)).toBeDefined();
    });

    for (const ghost of GHOST_COA_NAMES) {
      expect(screen.queryByText(new RegExp(ghost))).toBeNull();
    }
  });

  it("does not label an unmapped/unlisted account with an invented name", async () => {
    // The live chart of accounts does NOT contain "21111": the mapping is still
    // set, so the honest render is the code with no invented name — the literal
    // used to supply "Hutang Dagang" here.
    reply = async (url) => {
      if (url.includes("/finance/accounts")) return { status: 200, body: [] };
      if (url.includes("/finance/journal")) return { status: 200, body: [] };
      if (url.includes("/finance/dashboard/advanced")) return { status: 200, body: { metrics: {} } };
      return { status: 200, body: [] };
    };

    renderWithClient(<JurnalPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/finance/accounts"))).toBe(true);
    });

    for (const ghost of GHOST_COA_NAMES) {
      expect(screen.queryByText(new RegExp(ghost))).toBeNull();
    }
  });

  it("does not invent account names when the accounts request fails", async () => {
    reply = async (url) => {
      if (url.includes("/finance/accounts")) return { status: 500, body: { message: "boom" } };
      if (url.includes("/finance/journal")) return { status: 200, body: [] };
      if (url.includes("/finance/dashboard/advanced")) return { status: 200, body: { metrics: {} } };
      return { status: 200, body: [] };
    };

    renderWithClient(<JurnalPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/finance/accounts"))).toBe(true);
    });

    await waitFor(() => {
      for (const ghost of GHOST_COA_NAMES) {
        expect(screen.queryByText(new RegExp(ghost))).toBeNull();
      }
    });
  });
});