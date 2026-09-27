/**
 * Reproduction test — the four Master CRUD pages are read-only shells with fake write actions.
 *
 * Defect (measured 2026-09-26):
 *   /master/suppliers  (1146 lines) — only `GET /master/suppliers`. `handleSaveSupplier` mints
 *     `id: \`sup-${Date.now()}\`` and prepends it to local state, `handleDeleteSupplier` filters
 *     local state, and the Excel import modal has no `<input type="file">` at all — "Mulai Import"
 *     fires `toast.success("12 Rekanan Supplier berhasil diimpor dari Excel.")`, a hardcoded
 *     success carrying an invented count of 12.
 *   /master/customers  (1165 lines) — same shape; create/edit/delete are local-state only.
 *   /master/goods      (1155 lines) — two GETs; barang and category create/edit/delete are local.
 *   /master/warehouses (1039 lines) — one GET; warehouse create/edit/delete and access grants are
 *     local-state only.
 *
 * The toasts say "berhasil". A refresh loses the record. This is a data-loss class defect, not a
 * cosmetic one: the user is told the write succeeded when nothing was sent.
 *
 * The backend fully implements these routes (`backend/src/modules/master/controllers/`):
 *   POST   /master/suppliers   PATCH /master/suppliers/:id   DELETE /master/suppliers/:id
 *   POST   /master/customers   PATCH /master/customers/:id   DELETE /master/customers/:id
 *   POST   /master/suppliers/import   GET /master/suppliers/export   (and the customer pair)
 *
 * Per CLAUDE.md QA GATE this test must FAIL before the fix and pass after.
 */
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

// `action=create` makes the page open its create modal on mount, so the save path is reachable
// without driving a toolbar click.
vi.mock("next/navigation", () => ({
  usePathname: () => "/master/suppliers",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("action=create"),
}));

import { api } from "@/lib/api";
import MasterSuppliersPage from "@/app/(dashboard)/master/suppliers/page";

// __dirname is `src/app/(dashboard)/master/__tests__`.
const APP = path.resolve(__dirname, "..", "..", "..");
const pageSrc = (rel: string) => fs.readFileSync(path.join(APP, rel), "utf8");

/** The body of a named handler, from `const <name>` up to the next top-level `const`/`return`. */
function handlerBody(src: string, name: string): string {
  const start = src.indexOf(`const ${name} =`);
  if (start < 0) return "";
  const rest = src.slice(start + 1);
  const end = rest.search(/\n {2}(?:const|function|return) /);
  return end < 0 ? rest : rest.slice(0, end);
}

/**
 * Does the write path from this handler reach the backend?
 *
 * The handler may call `api.post(...)` itself, or — the shape the fix uses — hand off to a
 * TanStack mutation and let its `mutationFn` do the POST/PATCH. Either is a real write; a handler
 * that only touches React state reaches neither. A test insisting on a literal `api.post(` inside
 * the handler would forbid the mutation, so this follows the path instead of the spelling.
 *
 * Verified against the defect: with local-state-only handlers this returns false.
 */
function handlerReachesBackend(src: string, handlerName: string): boolean {
  const body = handlerBody(src, handlerName);
  if (/api\.(post|patch|put)\(/.test(body)) return true;
  const handoff = body.match(/(\w+Mut(?:ation)?)\.mutate\(/);
  if (!handoff) return false;
  // Follow one hop: the mutation in the same file must issue the request.
  return /api\.(post|patch|put)\(/.test(handlerBody(src, handoff[1]));
}

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

describe("master CRUD pages must actually persist, not just toast", () => {
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

  // ── /master/suppliers ────────────────────────────────────────────────────────
  it("suppliers: saving a new supplier sends POST /master/suppliers", async () => {
    reply = async () => ({ status: 200, body: [] });

    renderWithClient(<MasterSuppliersPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/master/suppliers"))).toBe(true);
    });

    fireEvent.change(await screen.findByPlaceholderText("e.g. PT DKSH Indonesia"), {
      target: { value: "PT Uji Persistensi" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Ibu Wenny"), { target: { value: "Budi" } });
    fireEvent.change(screen.getByPlaceholderText("082244023077"), { target: { value: "081200000001" } });

    fireEvent.click(screen.getByText("Simpan Data Supplier"));

    await waitFor(() => {
      expect(calls.some((c) => c.startsWith("POST /master/suppliers"))).toBe(true);
    });
  });

  it("suppliers: the save handler is not local-state only", () => {
    const src = pageSrc("(dashboard)/master/suppliers/page.tsx");
    const body = handlerBody(src, "handleSaveSupplier");
    expect(body).not.toBe("");
    // The defect signature is a handler that "persists" by editing the rendered list.
    expect(body).not.toMatch(/setSuppliersList\(/);
    expect(handlerReachesBackend(src, "handleSaveSupplier")).toBe(true);
  });

  it("suppliers: deleting sends DELETE /master/suppliers/:id", () => {
    const src = pageSrc("(dashboard)/master/suppliers/page.tsx");
    expect(handlerBody(src, "handleDeleteSupplier")).not.toMatch(/setSuppliersList\(/);
    expect(src).toMatch(/api\.delete\(\s*`?\/master\/suppliers\//);
  });

  it("suppliers: the Excel import is not a hardcoded success", () => {
    const src = pageSrc("(dashboard)/master/suppliers/page.tsx");
    // The invented count was the tell that no file was ever read.
    expect(src).not.toContain("12 Rekanan Supplier berhasil diimpor dari Excel.");
    // A real import reads a file off disk and posts its contents to the import route.
    expect(src).toMatch(/type=["']file["']/);
    expect(src).toMatch(/\/master\/suppliers\/import/);
    expect(src).not.toContain("<input");
  });

  // ── the other three, source-level ────────────────────────────────────────────
  const pages: Array<[string, string, string, RegExp, RegExp]> = [
    ["customers", "(dashboard)/master/customers/page.tsx", "handleSaveCustomer", /setCustomersList\(/, /api\.(post|patch|put)\(\s*`?\/master\/customers/],
    ["goods", "(dashboard)/master/goods/page.tsx", "handleSaveBarang", /setGoodsList\(/, /api\.(post|patch|put)\(\s*`?\/master\/materials/],
    ["warehouses", "(dashboard)/master/warehouses/page.tsx", "handleSaveWarehouse", /setWarehousesList\(/, /api\.(post|patch|put)\(\s*`?\/master\/warehouses/],
  ];

  for (const [name, rel, handler, localSetter, routeCall] of pages) {
    it(`${name}: ${handler} persists through the backend`, () => {
      const src = pageSrc(rel);
      const body = handlerBody(src, handler);
      expect(body, `${handler} not found in ${rel}`).not.toBe("");
      expect(body, `${handler} still persists to local state`).not.toMatch(localSetter);
      expect(handlerReachesBackend(src, handler), `${handler} calls no backend write`).toBe(true);
      expect(src, `${rel} has no write call to its route`).toMatch(routeCall);
    });
  }

  it("goods: category save calls the backend", () => {
    const src = pageSrc("(dashboard)/master/goods/page.tsx");
    const body = handlerBody(src, "handleSaveCategory");
    expect(body).not.toBe("");
    expect(body).not.toMatch(/setCategoriesList\(/);
    expect(handlerReachesBackend(src, "handleSaveCategory")).toBe(true);
  });
});
