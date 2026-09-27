/**
 * Reproduction test — `quality/checklist` is three separate fabrications.
 *
 * Defect (found by the Fase 2 fabrication triage, 2026-09-25):
 *   1. Tab 1 "Checklist Operasional" — `INITIAL_CHECKLISTS` (4 invented SO rows:
 *      "SO-2026-0512 / PT Glow Skin Global / GlowSkin Aesthetic" …) is rendered
 *      whenever the live query is empty, and the live mapper fabricates values
 *      inside a SUCCESSFUL response too (`c.salesOrder?.soNumber || "SO-NEX-001"`,
 *      `|| "PT Glow Skin Global"`, `|| "Protokol audit mutu CPKB …"`). On top of
 *      that the whole `queryFn` sits in a bare `catch {}`, so a failed request
 *      silently becomes the literal.
 *   2. Tab 2 "Kategori Checklist" — `INITIAL_CATEGORIES` (16 invented milestone
 *      rows with invented lead-times) plus local-only add/edit/delete handlers.
 *      `GET /qc/checklists/categories` is the only route that exists; there is no
 *      POST/PATCH/DELETE, so those writes go nowhere.
 *   3. Tab 3 "Kelola Checklist SO" — `INITIAL_MANAGE_CHECKLISTS` (invented PIC
 *      names, durations, MEETING-style notes) and a local-only status toggle.
 *      `PATCH /qc/checklists/:id { completedItems }` is the real route.
 *
 * Backend contract actually used here:
 *   GET   /qc/checklists              → { id, title, salesOrderId, workOrderId,
 *                                         status, items[], completedItems[],
 *                                         notes, createdAt, updatedAt, progress,
 *                                         creator }
 *   POST  /qc/checklists              → { title, workOrderId?, items[] }
 *   PATCH /qc/checklists/:id          → { status?, completedItems?, notes? }
 *   GET   /qc/checklists/categories   → { id, label, order, gate }[]
 *
 * NOTE: `QCChecklist.salesOrderId` is a bare scalar — `qc.prisma` declares no
 * `salesOrder` relation and `findAll` includes only `creator`. There is therefore
 * no SO number, client name or brand anywhere in this payload, and the page must
 * render those as unknown instead of an invented identity.
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
  usePathname: () => "/quality/checklist",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { api } from "@/lib/api";
import ChecklistHubPage from "@/app/(dashboard)/quality/checklist/page";

const SRC = path.resolve(__dirname, "..", "checklist", "page.tsx");

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

/** Exactly what `GET /qc/checklists` returns — no SO number, no client, no brand. */
const LIVE_CHECKLIST = {
  id: "cl-1",
  title: "Batch Uji Stabilitas Live",
  salesOrderId: null,
  workOrderId: null,
  status: "PENDING",
  items: [{ label: "Box / Kemasan" }, { label: "Label / Stiker" }],
  completedItems: ["Box / Kemasan"],
  notes: null,
  createdAt: "2026-09-01T02:00:00.000Z",
  updatedAt: "2026-09-10T02:00:00.000Z",
  progress: 50,
  creator: { id: "u-1", fullName: "Auditor Live" },
};

/** Exactly what `GET /qc/checklists/categories` returns. */
const LIVE_CATEGORY = { id: "BOX", label: "Box / Kemasan Live", order: 1, gate: "G1" };

/** Invented identities that exist only in the three removed literals. */
const GHOST_IDENTITIES = [
  "SO-2026-0512",
  "SO-2026-0508",
  "SO-NEX-001",
  "PT Glow Skin Global",
  "GlowSkin Aesthetic",
  "PT Cantika Herbal Nusantara",
  "HerbalCare Botanica",
  "Protokol audit mutu CPKB untuk batch produksi.",
  "Fitri Handayani (BusDev)",
  "Budi Hermawan (Sales)",
];

/** Invented category/department labels from the removed `INITIAL_CATEGORIES`. */
const GHOST_CATEGORIES = [
  "BPOM NA (Notifikasi)",
  "Pengadaan Bahan Baku",
  "Regulasi & BPOM",
  "Gudang & Finishing",
];

function expectNoGhosts() {
  for (const ghost of [...GHOST_IDENTITIES, ...GHOST_CATEGORIES]) {
    expect(screen.queryByText(ghost)).toBeNull();
  }
}

describe("quality/checklist — must not fabricate checklists, categories or SO identity", () => {
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

  it("source contains none of the three seed literals", () => {
    const src = fs.readFileSync(SRC, "utf-8");
    expect(src).not.toContain("const INITIAL_CHECKLISTS");
    expect(src).not.toContain("const INITIAL_CATEGORIES");
    expect(src).not.toContain("const INITIAL_MANAGE_CHECKLISTS");
  });

  it("source contains no local-only category mutation", () => {
    const src = fs.readFileSync(SRC, "utf-8");
    // `/qc/checklists/categories` has only a GET — no write route exists.
    expect(src).not.toContain("handleDeleteCategory");
    expect(src).not.toContain("handleSaveCategory");
  });

  it("renders the live checklist from /qc/checklists", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists")) return { status: 200, body: [LIVE_CHECKLIST] };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistHubPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists"))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Batch Uji Stabilitas Live")).toBeDefined();
    });

    expectNoGhosts();
  });

  it("does not invent an SO identity the backend never sent", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists")) return { status: 200, body: [LIVE_CHECKLIST] };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistHubPage />);

    await waitFor(() => {
      expect(screen.getByText("Batch Uji Stabilitas Live")).toBeDefined();
    });

    // `salesOrderId` is null and the payload has no client/brand at all.
    expect(screen.queryByText("SO-NEX-001")).toBeNull();
    expect(screen.queryByText("PT Glow Skin Global")).toBeNull();
    expect(screen.queryByText("GlowSkin")).toBeNull();
    expect(screen.queryByText("Maklon Baru")).toBeNull();
  });

  it("does not fall back to the literals when the API returns nothing", async () => {
    reply = async () => ({ status: 200, body: [] });

    renderWithClient(<ChecklistHubPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists"))).toBe(true);
    });

    expectNoGhosts();
  });

  it("does not fall back to the literals when the request fails", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists")) return { status: 500, body: { message: "boom" } };
      return { status: 200, body: [] };
    };

    renderWithClient(<ChecklistHubPage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists"))).toBe(true);
    });

    await waitFor(() => {
      expectNoGhosts();
    });
  });

  it("renders the live category label in the Kategori tab", async () => {
    reply = async (url) => {
      if (url.includes("/qc/checklists/categories")) return { status: 200, body: [LIVE_CATEGORY] };
      return { status: 200, body: [] };
    };

    const { container } = renderWithClient(<ChecklistHubPage />);

    const tab = await screen.findByRole("button", { name: /Kategori Checklist/i });
    tab.click();

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/qc/checklists/categories"))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Box / Kemasan Live")).toBeDefined();
    });

    for (const ghost of GHOST_CATEGORIES) {
      expect(screen.queryByText(ghost)).toBeNull();
    }
    expect(container.textContent).not.toContain("Desain Logo");
  });
});