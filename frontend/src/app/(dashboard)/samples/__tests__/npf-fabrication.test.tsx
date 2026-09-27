/**
 * Reproduction test — `samples/npf` falls back to fabricated NPF documents.
 *
 * Defect (found by the Fase 2 fabrication triage, 2026-09-25):
 *   `MOCK_NPFS` (line 75) is returned by the `npfs` useMemo whenever the live
 *   query yields nothing — including when the request FAILS (`catch` returns
 *   null) and when the API honestly reports zero documents. Three invented NPF
 *   documents ("NPF-202603-001" for "PT Cantika Glow Nusantara", …) were then
 *   rendered as if they were real lab workload, and they also drove the KPI tiles.
 *
 * The rows must come from the real sample lifecycle (`GET /rnd/samples` —
 * `SampleRequest`, the only model carrying stage/revision/PIC/courier). The
 * endpoint's empty result is not an error, so the honest output is an empty state.
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
  usePathname: () => "/samples/npf",
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
import NpfSamplePage from "@/app/(dashboard)/samples/npf/page";

const NPF_SRC = path.resolve(__dirname, "..", "npf", "page.tsx");

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

const MOCK_CODES = ["NPF-202603-001", "NPF-202603-002", "NPF-202603-003"];
const MOCK_CLIENTS = ["PT Cantika Glow Nusantara", "CV Derma Estetika Mandiri", "PT Miracle Beauty Lab"];

/** A real `SampleRequest` row, shaped exactly as `GET /rnd/samples` returns it. */
const LIVE_SAMPLE = {
  id: "11111111-1111-4111-8111-111111111111",
  sampleCode: "SMP-LIVE-001",
  productName: "Serum Nyata 30ml",
  targetFunction: "Brightening",
  textureReq: "Watery gel",
  colorReq: "Clear",
  aromaReq: "Unscented",
  version: 1,
  revisionCount: 0,
  stage: "FORMULATING",
  requestedAt: "2026-09-20T00:00:00.000Z",
  targetDeadline: "2026-10-01T00:00:00.000Z",
  targetHpp: "15000",
  courierName: null,
  trackingNumber: null,
  clientComment: null,
  lead: {
    clientName: "PT Klien Nyata",
    brandName: "NyataBrand",
    pic: { name: "BusDev Nyata" },
  },
  pic: { name: "Apt. Nyata" },
};

describe("samples/npf — no fabricated NPF documents", () => {
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

  it("source contains no MOCK_NPFS array", () => {
    const src = fs.readFileSync(NPF_SRC, "utf-8");
    expect(src).not.toContain("MOCK_NPFS");
  });

  it("renders an empty state, not mock documents, when the API returns none", async () => {
    reply = async (url) => {
      if (url.includes("/rnd/samples")) return { status: 200, body: [] };
      return { status: 200, body: [] };
    };

    renderWithClient(<NpfSamplePage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/rnd/samples"))).toBe(true);
    });

    await waitFor(() => {
      expect(screen.getByText("Tidak ada permintaan sample NPF yang sesuai.")).toBeDefined();
    });

    for (const ghost of [...MOCK_CODES, ...MOCK_CLIENTS]) {
      expect(screen.queryByText(ghost)).toBeNull();
    }
  });

  it("does not invent documents when the request fails", async () => {
    reply = async (url) => {
      if (url.includes("/rnd/samples")) return { status: 500, body: { message: "boom" } };
      return { status: 200, body: [] };
    };

    renderWithClient(<NpfSamplePage />);

    await waitFor(() => {
      expect(calls.some((c) => c.includes("/rnd/samples"))).toBe(true);
    });

    await waitFor(() => {
      for (const ghost of MOCK_CODES) {
        expect(screen.queryByText(ghost)).toBeNull();
      }
    });
  });

  it("renders the live sample request and counts only live documents in the KPI", async () => {
    reply = async (url) => {
      if (url.includes("/rnd/samples")) return { status: 200, body: [LIVE_SAMPLE] };
      return { status: 200, body: [] };
    };

    renderWithClient(<NpfSamplePage />);

    await waitFor(() => {
      expect(screen.getByText("SMP-LIVE-001")).toBeDefined();
    });
    expect(screen.getByText("PT Klien Nyata")).toBeDefined();
    expect(screen.getByText("1 Dokumen")).toBeDefined();
    for (const ghost of [...MOCK_CODES, ...MOCK_CLIENTS]) {
      expect(screen.queryByText(ghost)).toBeNull();
    }
  });
});