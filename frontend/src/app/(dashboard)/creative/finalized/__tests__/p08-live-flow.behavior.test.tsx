/**
 * P08 Acceptance 5 — the live P08 UI suite.
 *
 * Under test:
 *   - `frontend/src/app/(dashboard)/creative/finalized/page.tsx` — the ONE
 *     finalized-design history page (SCR-180)
 *   - `frontend/src/app/(dashboard)/legality/permits/page.tsx` — the permit
 *     expiry view
 *
 * The production API client (`@/lib/api`) is what these screens import, and it is
 * what runs here: the axios instance keeps its baseURL and its interceptors, and
 * only the socket beneath it is replaced. That is the external network boundary —
 * no business rule, RBAC decision, transaction or persistence seam is stubbed.
 *
 * Proves:
 *   1. no static array, no localStorage, no placeholder URL and no mock fallback
 *      is reachable from either page (source guard, plus a runtime probe with a
 *      unique sentinel payload)
 *   2. interactive/visual primitives come from `@/components/dna`
 *   3. loading, empty, error, denied and success are each visibly handled
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

// next/navigation is used by the shell's page transition; it is router plumbing,
// not a data source.
vi.mock("next/navigation", () => ({
  usePathname: () => "/creative/finalized",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { api } from "@/lib/api";
import FinalizedDesignsPage from "@/app/(dashboard)/creative/finalized/page";
import PermitsPage from "@/app/(dashboard)/legality/permits/page";

const FINALIZED_PATH = "/creative/finalized";
const PERMITS_PATH = "/legality/permits";

const FINALIZED_SRC = path.resolve(__dirname, "..", "page.tsx");
const PERMITS_SRC = path.resolve(__dirname, "..", "..", "..", "legality", "permits", "page.tsx");

type Reply = { status: number; body: unknown };

/** Routes every call through one switch so a test can hang, fail or answer. */
let reply: (url: string) => Promise<Reply>;
const calls: string[] = [];
let originalAdapter: unknown;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("P08 Acceptance 5 — live P08 UI", () => {
  beforeAll(() => {
    originalAdapter = api.defaults.adapter;
    api.defaults.adapter = async (config: any) => {
      const url = String(config.url ?? "");
      calls.push(url);
      const { status, body } = await reply(url);
      const response = {
        data: body,
        status,
        statusText: String(status),
        headers: {},
        config,
      };
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
    reply = async () => {
      throw new Error(`unexpected call: ${calls[calls.length - 1]}`);
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ── 1. no static / localStorage / placeholder / mock data source ──────────
  describe("no static, localStorage, placeholder or mock data source is reachable", () => {
    const pages: Array<[string, string]> = [
      ["creative/finalized", FINALIZED_SRC],
      ["legality/permits", PERMITS_SRC],
    ];

    it.each(pages)("%s has no in-file data source or placeholder URL", (_label, file) => {
      const src = fs.readFileSync(file, "utf8");

      expect(src).not.toMatch(/localStorage/);
      expect(src).not.toMatch(/sessionStorage/);
      // no hardcoded absolute endpoint — every call goes through the client
      expect(src).not.toMatch(/https?:\/\//);
      // no fabricated dataset and no fallback constant
      expect(src).not.toMatch(/\bconst\s+(INITIAL_|MOCK_|FALLBACK_|DEMO_|DUMMY_)/);
      expect(src).not.toMatch(/\bMOCK_[A-Z_]*\b/);
      expect(src).not.toMatch(/placehold\.co/);

      // the only data module it reaches for is the production API client
      expect(src).toMatch(/from "@\/lib\/api"/);
      expect(src).toMatch(/api\.get\(/);
    });

    it.each(pages)("%s composes its primitives from @/components/dna only", (_label, file) => {
      const src = fs.readFileSync(file, "utf8");
      const importLines = src
        .split("\n")
        .filter((line) => /^\s*import\b/.test(line) || /^\s*}?\s*from "/.test(line));
      const joined = importLines.join("\n");

      expect(joined).toMatch(/@\/components\/dna/);
      // no raw component-library primitives on an affected screen
      expect(joined).not.toMatch(/@\/components\/ui\//);
      expect(joined).not.toMatch(/@radix-ui\//);
      expect(joined).not.toMatch(/@\/components\/shadcn/);
    });

    it("renders only the API payload — nothing inline survives into the DOM", async () => {
      const sentinel = "SENTINEL-ONLY-FROM-THE-API";
      reply = async (url) => {
        if (url === FINALIZED_PATH) {
          return {
            status: 200,
            body: {
              data: [
                {
                  id: "d-1",
                  brief: sentinel,
                  kanbanState: "LOCKED",
                  revisionCount: 0,
                  isLocked: false,
                  isFinal: true,
                  updatedAt: new Date().toISOString(),
                  finalArtworkUrl: null,
                  lead: { id: "l-1", clientName: sentinel, brandName: sentinel },
                  versions: [],
                  feedbacks: [],
                  approvedVersion: { id: "v-1", versionNumber: 1 },
                },
              ],
              total: 1,
              page: 1,
              limit: 50,
            },
          };
        }
        throw new Error(`unexpected call: ${url}`);
      };

      const { container } = renderWithClient(<FinalizedDesignsPage />);
      await waitFor(() => {
        expect(screen.getAllByText(sentinel).length).toBeGreaterThan(0);
      });
      expect(calls).toEqual([FINALIZED_PATH]);
      // the page renders the sentinel and nothing fabricated alongside it
      expect(container.textContent).toContain(sentinel);
    });
  });

  // ── 2. creative/finalized ─────────────────────────────────────────────────
  describe("creative/finalized — the one finalized-design history page", () => {
    it("shows loading until the production API resolves", async () => {
      reply = () => new Promise<Reply>(() => {});
      const { container } = renderWithClient(<FinalizedDesignsPage />);
      expect(screen.getByText("Desain Final & Riwayat")).toBeInTheDocument();
      expect(container.querySelector(".animate-pulse")).not.toBeNull();
      expect(screen.queryByText("Belum ada desain final")).toBeNull();
      await waitFor(() => expect(calls).toEqual([FINALIZED_PATH]));
    });

    it("shows the empty state when the API returns no finalized designs", async () => {
      reply = async () => ({ status: 200, body: { data: [], total: 0, page: 1, limit: 50 } });
      renderWithClient(<FinalizedDesignsPage />);
      await waitFor(() => {
        expect(screen.getByText("Belum ada desain final")).toBeInTheDocument();
      });
    });

    it("shows the error state on a failure", async () => {
      reply = async () => ({ status: 500, body: { message: "Backend unavailable" } });
      renderWithClient(<FinalizedDesignsPage />);
      await waitFor(() => {
        expect(screen.getByText("Gagal memuat data")).toBeInTheDocument();
      });
      expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    });

    it("shows the denied state on 403, without leaking the server payload", async () => {
      reply = async () => ({ status: 403, body: { message: "INTERNAL_STACK_TRACE", stack: "secret" } });
      renderWithClient(<FinalizedDesignsPage />);
      await waitFor(() => {
        expect(screen.getByText("Akses ditolak")).toBeInTheDocument();
      });
      expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
      expect(screen.queryByText(/INTERNAL_STACK_TRACE/)).toBeNull();
    });

    it("shows the success state with the API's own values", async () => {
      reply = async (url) => {
        if (url !== FINALIZED_PATH) throw new Error(`unexpected call: ${url}`);
        return {
          status: 200,
          body: {
            data: [
              {
                id: "d-1",
                brief: "Label Serum Brightening",
                kanbanState: "LOCKED",
                revisionCount: 2,
                isLocked: true,
                isFinal: true,
                updatedAt: "2026-09-20T00:00:00.000Z",
                finalArtworkUrl: "/uploads/creative_assets/v3.ai",
                lead: { id: "l-1", clientName: "PT Kirana", brandName: "Kirana Glow" },
                versions: [
                  { id: "v-1", versionNumber: 1 },
                  { id: "v-3", versionNumber: 3 },
                ],
                feedbacks: [
                  {
                    id: "f-1",
                    content: "Klien meminta logo diperbesar",
                    approvalStatus: "APPROVED",
                    fromDivision: "BD",
                    createdAt: "2026-09-20T00:00:00.000Z",
                    version: { id: "v-3", versionNumber: 3 },
                    author: { id: "u-1", fullName: "Rina Busdev" },
                  },
                ],
                approvedVersion: { id: "v-3", versionNumber: 3 },
              },
            ],
            total: 1,
            page: 1,
            limit: 50,
          },
        };
      };

      renderWithClient(<FinalizedDesignsPage />);

      await waitFor(() => {
        expect(screen.getByText("Kirana Glow")).toBeInTheDocument();
      });
      // the approved version is the stored fact from the API, not a guess
      expect(screen.getByText("V3")).toBeInTheDocument();
      expect(screen.getByText("Label Serum Brightening")).toBeInTheDocument();
      expect(screen.getByText("TERKUNCI")).toBeInTheDocument();
      expect(calls).toEqual([FINALIZED_PATH]);
    });
  });

  // ── 3. legality/permits ───────────────────────────────────────────────────
  describe("legality/permits — the permit expiry view", () => {
    it("shows loading until the production API resolves", async () => {
      reply = () => new Promise<Reply>(() => {});
      renderWithClient(<PermitsPage />);
      expect(screen.getByText("Syncing regulatory registry...")).toBeInTheDocument();
      await waitFor(() => expect(calls).toEqual([PERMITS_PATH]));
    });

    it("shows the empty state when the API returns no permits", async () => {
      reply = async () => ({ status: 200, body: [] });
      renderWithClient(<PermitsPage />);
      await waitFor(() => {
        expect(
          screen.getByText("Tidak ada data berkas perizinan yang ditemukan"),
        ).toBeInTheDocument();
      });
    });

    it("shows the error state on a failure", async () => {
      reply = async () => ({ status: 500, body: { message: "Registry unavailable" } });
      renderWithClient(<PermitsPage />);
      await waitFor(() => {
        expect(screen.getByText("Gagal memuat data")).toBeInTheDocument();
      });
      expect(screen.getByText("Registry unavailable")).toBeInTheDocument();
    });

    it("shows the denied state on 403", async () => {
      reply = async () => ({ status: 403, body: { message: "Forbidden" } });
      renderWithClient(<PermitsPage />);
      await waitFor(() => {
        expect(screen.getByText("Akses ditolak")).toBeInTheDocument();
      });
      expect(screen.getByText(/tidak memiliki akses/i)).toBeInTheDocument();
    });

    it("shows the success state, with the expiry status the API returned", async () => {
      reply = async (url) => {
        if (url !== PERMITS_PATH) throw new Error(`unexpected call: ${url}`);
        return {
          status: 200,
          body: [
            {
              id: "BPOM-1",
              name: "Izin Edar BPOM — Serum Kirana",
              type: "Health/Cosmetic",
              expiry: "2026-12-05",
              status: "EXPIRING_SOON",
              issuer: "BPOM RI",
            },
            {
              id: "HKI-1",
              name: "Merek Kirana Glow",
              type: "Merek",
              expiry: "2026-09-19",
              status: "EXPIRED",
              issuer: "DJKI",
            },
          ],
        };
      };

      renderWithClient(<PermitsPage />);

      await waitFor(() => {
        expect(screen.getByText("BPOM-1")).toBeInTheDocument();
      });
      expect(screen.getByText("HKI-1")).toBeInTheDocument();
      // "EXPIRING SOON" is also the KPI tile label, so the row badge is not unique
      expect(screen.getAllByText("EXPIRING SOON").length).toBeGreaterThan(0);
      // an expired permit is shown as expired, never as valid
      expect(screen.getByText("EXPIRED")).toBeInTheDocument();
      expect(screen.getByText("2026-09-19")).toBeInTheDocument();
      expect(calls).toEqual([PERMITS_PATH]);
    });
  });
});
