/**
 * Reproduction test — `quality/checklist-category` falls back to a fabricated
 * category table AND invents per-row values on top of the live payload.
 *
 * Defect (found by the Fase 2 fabrication triage, 2026-09-25):
 *   `STATIC_CATEGORIES` (line 49) holds eight invented rows ("Desain Logo",
 *   "HKI", "BPOM NA", …) with invented lead-times. Three ways that reaches a
 *   production viewer:
 *     1. `catch {}` swallows a failed request and the literal is rendered;
 *     2. an honest empty response renders the literal (8 rows that do not exist);
 *     3. even on a SUCCESSFUL response the mapper fabricates values the backend
 *        never sends — `lama_hari: c.defaultDays || 7` (always 7, because
 *        `/qc/checklists/categories` returns only `{id,label,order,gate}`) and
 *        `setelah: c.after || c.afterCategory || "-"` (always "-").
 *   The KPI tiles are four hardcoded literals (`"24"`, `"84d"`, `"18"`, `"Low"`).
 *
 * Honest behaviour: rows come only from `GET /qc/checklists/categories`; a field
 * the backend does not send renders as "—" instead of a made-up default; the
 * KPIs are derived from the live rows (or omitted when underivable).
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
  usePathname: () => "/quality/checklist-category",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { api } from "@/lib/api";
import ChecklistCategoryPage from "@/app/(dashboard)/quality/checklist-category/page";

const SRC = path.resolve(__dirname, "..", "checklist-category", "page.tsx");

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

/** Exactly what `GET /qc/checklists/categories` returns: {id,label,order,gate}. */
const LIVE_CATEGORY = { id: "BOX", label: "Box / Kemasan Live", order: 1, gate: "G1" };

/** Invented identities that exist only in the removed `STATIC_CATEGORIES`. */
const GHOST_NAMES = ["Desain Logo", "BPOM NA", "BPOM Merk", "Uji Lab", "Packing"];

describe("quality/checklist-category — must not fabricate categories or lead-times", () => {
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

  it("source contains no STATIC_CATEGORIES array", () => {
    const src = fs.readFileSync(SRC, "utf-8");
    expect(src).not.toContain("const STATIC_CATEGORIES");
  });

  it("renders the live category from /qc/checklists/categories", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists/categories")) return { status: 200, body: [LIVE_CATEGORY] };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistCategoryPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists/categories"))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Box / Kemasan Live")).toBeDefined();
    });

    for (const ghost of GHOST_NAMES) {
      expect(screen.queryByText(ghost)).toBeNull();
    }
  });

  it("does not invent a lead-time the backend never sent", async () => {
    // `/qc/checklists/categories` has no `defaultDays`, so the old mapper always
    // substituted 7 and the row claimed "7 Days" for every category.
    reply = async (url) => {
      if (url.includes("/qc/checklists/categories")) return { status: 200, body: [LIVE_CATEGORY] };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistCategoryPage />);

    await waitFor(() => {
      expect(screen.getByText("Box / Kemasan Live")).toBeDefined();
    });

    expect(screen.queryByText(/^7$/)).toBeNull();
    expect(screen.queryByText("84d")).toBeNull();
  });

  it("does not fall back to the literal when the API returns nothing", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists/categories")) return { status: 200, body: [] };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistCategoryPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists/categories"))).toBe(true);
    });

    for (const ghost of GHOST_NAMES) {
      expect(screen.queryByText(ghost)).toBeNull();
    }
    // The hardcoded KPI literals are not data from anywhere.
    expect(screen.queryByText("24")).toBeNull();
    expect(screen.queryByText("Low")).toBeNull();
  });

  it("does not fall back to the literal when the request fails", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists/categories")) return { status: 500, body: { message: "boom" } };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistCategoryPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists/categories"))).toBe(true);
    });

    await waitFor(() => {
      for (const ghost of GHOST_NAMES) {
        expect(screen.queryByText(ghost)).toBeNull();
      }
    });
  });
});