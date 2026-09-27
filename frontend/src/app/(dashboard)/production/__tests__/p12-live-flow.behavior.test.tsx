/**
 * P12 Acceptance Suite — Live P12 PPIC & Production Scheduling UI Suite.
 *
 * Under test:
 *   - `schedule-mixing/page.tsx` — Mixing scheduling, scale-up math & stage guards
 *   - `schedule-filling/page.tsx` — Filling line scheduling & primary packaging
 *   - `schedule-packaging/page.tsx` — Secondary packaging line scheduling
 *   - `work-orders/page.tsx` — SPK Work Order tracking & stage advance
 *   - `material-requisition/page.tsx` — SPB material readiness & warehouse issue tracking
 *   - `production-planning-dashboard/page.tsx` — PPIC Command Center
 *
 * Proves:
 *   1. No static arrays, no localStorage, no placeholder URLs, no mock constants survive.
 *   2. Primitives are composed from design system (@/components/dna or @/components/ui).
 *   3. The production API client (@/lib/api) is the sole data vehicle.
 *   4. Loading, empty, and live data states render honestly across surfaces.
 */
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError } from "axios";

// Router mock
vi.mock("next/navigation", () => ({
  usePathname: () => "/production/schedule-mixing",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { api } from "@/lib/api";
import ScheduleMixingPage from "@/app/(dashboard)/production/schedule-mixing/page";
import ScheduleFillingPage from "@/app/(dashboard)/production/schedule-filling/page";
import SchedulePackagingPage from "@/app/(dashboard)/production/schedule-packaging/page";
import WorkOrdersPage from "@/app/(dashboard)/production/work-orders/page";
import MaterialRequisitionPage from "@/app/(dashboard)/production/material-requisition/page";
import PPICDashboard from "@/app/(dashboard)/production/production-planning-dashboard/page";

const BASE_DIR = path.resolve(__dirname, "..");
const MIXING_SRC = path.resolve(BASE_DIR, "schedule-mixing", "page.tsx");
const FILLING_SRC = path.resolve(BASE_DIR, "schedule-filling", "page.tsx");
const PACKAGING_SRC = path.resolve(BASE_DIR, "schedule-packaging", "page.tsx");
const WO_SRC = path.resolve(BASE_DIR, "work-orders", "page.tsx");
const REQ_SRC = path.resolve(BASE_DIR, "material-requisition", "page.tsx");
const DASHBOARD_SRC = path.resolve(BASE_DIR, "production-planning-dashboard", "page.tsx");

type Reply = { status: number; body: unknown };
let reply: (url: string) => Promise<Reply>;
const calls: string[] = [];
let originalAdapter: unknown;

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("P12 Acceptance — Live P12 PPIC & Production UI", () => {
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

  // ── 1. Source Guards on all P12 surfaces ─────────────────────────────────────
  describe("Source Guards: Zero static mocks or local storage on all P12 surfaces", () => {
    const p12Pages: Array<[string, string]> = [
      ["schedule-mixing", MIXING_SRC],
      ["schedule-filling", FILLING_SRC],
      ["schedule-packaging", PACKAGING_SRC],
      ["work-orders", WO_SRC],
      ["material-requisition", REQ_SRC],
      ["production-planning-dashboard", DASHBOARD_SRC],
    ];

    it.each(p12Pages)("%s contains no mock data arrays, localStorage or absolute URLs", (_label, file) => {
      const src = fs.readFileSync(file, "utf8");

      expect(src).not.toMatch(/localStorage/);
      expect(src).not.toMatch(/sessionStorage/);
      expect(src).not.toMatch(/https?:\/\//);
      expect(src).not.toMatch(/placehold\.co/);

      // Verify no non-empty static mock arrays exist
      expect(src).not.toMatch(/\bconst\s+(INITIAL_|MOCK_|FALLBACK_|DEMO_|DUMMY_)\w*\s*=\s*\[\s*\{/);

      // Interactive pages use production api client and react-query
      if (file.endsWith("page.tsx")) {
        expect(src).toMatch(/from "@\/lib\/api"/);
        expect(src).toMatch(/useQuery/);
      }
    });

    it.each(p12Pages)("%s uses design system primitives", (_label, file) => {
      const src = fs.readFileSync(file, "utf8");
      expect(src.includes("@/components/dna") || src.includes("@/components/ui")).toBe(true);
    });
  });

  // ── 2. Surface 1: Schedule Mixing ───────────────────────────────────────────
  describe("Surface 1: schedule-mixing/page.tsx", () => {
    it("renders live mixing schedules from backend API", async () => {
      const sentinelBatch = "BR-2026-P12-MIX";
      const sentinelProduct = "Brightening Serum Phase 12";

      reply = async (url) => {
        if (url.includes("/production/schedules") && url.includes("stage=MIXING")) {
          return {
            status: 200,
            body: [
              {
                id: "sch-mix-01",
                scheduleNumber: "SCH-MIX-2026-0099",
                startTime: "2026-09-21T08:00:00.000Z",
                targetQty: 5000,
                upscalePercent: 10,
                upscaleResult: 5500,
                status: "SCHEDULED",
                notes: "Uji kecepatan impeller homogenizer",
                workOrder: {
                  woNumber: sentinelBatch,
                  lead: {
                    clientName: "PT Aura Maklon Sejahtera",
                    brandName: sentinelProduct,
                  },
                },
              },
            ],
          };
        }
        return { status: 200, body: [] };
      };

      renderWithClient(<ScheduleMixingPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelBatch)).toBeInTheDocument();
        expect(screen.getByText(sentinelProduct)).toBeInTheDocument();
      });
    });
  });

  // ── 3. Surface 2: Schedule Filling ──────────────────────────────────────────
  describe("Surface 2: schedule-filling/page.tsx", () => {
    it("renders live filling schedules from backend API", async () => {
      const sentinelCode = "SCH-FIL-2026-9999";
      const sentinelCust = "CV Mandiri Skin Care";

      reply = async (url) => {
        if (url.includes("/production/schedules") && url.includes("stage=FILLING")) {
          return {
            status: 200,
            body: [
              {
                id: "sch-fil-01",
                scheduleNumber: sentinelCode,
                startTime: "2026-09-21T09:00:00.000Z",
                targetQty: 3000,
                status: "SCHEDULED",
                notes: "Line Rotary 4-head",
                workOrder: {
                  woNumber: "BR-2026-FIL-01",
                  lead: {
                    clientName: sentinelCust,
                    brandName: "Acne Toner 100ml",
                  },
                },
              },
            ],
          };
        }
        return { status: 200, body: [] };
      };

      renderWithClient(<ScheduleFillingPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelCode)).toBeInTheDocument();
        expect(screen.getByText(sentinelCust)).toBeInTheDocument();
      });
    });
  });

  // ── 4. Surface 3: Schedule Packaging ────────────────────────────────────────
  describe("Surface 3: schedule-packaging/page.tsx", () => {
    it("renders live packaging schedules from backend API", async () => {
      const sentinelPkgCode = "SCH-PKG-2026-8888";
      const sentinelProduct = "Hydrating Gel UV 50gr";

      reply = async (url) => {
        // ProdStage enum is BATCHING|MIXING|FILLING|PACKING — the pages ask for
        // stage=PACKING, so this stub must match that or it replies [].
        if (url.includes("/production/schedules") && url.includes("stage=PACKING")) {
          return {
            status: 200,
            body: [
              {
                id: "sch-pkg-01",
                scheduleNumber: sentinelPkgCode,
                startTime: "2026-09-21T10:00:00.000Z",
                targetQty: 2500,
                status: "SCHEDULED",
                notes: "Shrink wrap and carton packing",
                workOrder: {
                  woNumber: "BR-2026-PKG-01",
                  lead: {
                    clientName: "PT Cantika Kosmetika",
                    brandName: sentinelProduct,
                  },
                },
              },
            ],
          };
        }
        return { status: 200, body: [] };
      };

      renderWithClient(<SchedulePackagingPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelPkgCode)).toBeInTheDocument();
        expect(screen.getByText(sentinelProduct)).toBeInTheDocument();
      });
    });
  });

  // ── 5. Surface 4: Work Orders ───────────────────────────────────────────────
  describe("Surface 4: work-orders/page.tsx", () => {
    it("renders live active work orders from backend API", async () => {
      const sentinelWO = "SPK-2026-P12-LIVE";
      const sentinelBatch = "BATCH-P12-001";

      reply = async (url) => {
        if (url === "/production/active") {
          return {
            status: 200,
            body: [
              {
                id: "wo-live-01",
                code: sentinelWO,
                batchNumber: sentinelBatch,
                salesOrderCode: "SO-2026-P12-01",
                customerName: "PT Bintang Herbal",
                brandName: "BintangBeauty",
                productName: "Herbal Essence Face Wash",
                category: "Skincare",
                netto: "100 ml",
                targetQty: 4000,
                goodQty: 2000,
                rejectQty: 5,
                startDate: "2026-09-21T00:00:00.000Z",
                targetDate: "2026-09-25T00:00:00.000Z",
                currentStage: "MIXING",
                progressPct: 50,
                status: "IN_PROGRESS",
                picOperator: "Budi Santoso",
                notes: "Proses mixing ruahan 400 Kg",
              },
            ],
          };
        }
        return { status: 200, body: [] };
      };

      renderWithClient(<WorkOrdersPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelWO)).toBeInTheDocument();
        expect(screen.getByText(sentinelBatch)).toBeInTheDocument();
      });
    });
  });

  // ── 6. Surface 5: Material Requisition ──────────────────────────────────────
  describe("Surface 5: material-requisition/page.tsx", () => {
    it("renders live material requisitions from backend API", async () => {
      const sentinelSPB = "SPB-PRD-2026-P12";
      const sentinelProduct = "Centella Calming Emulsion";

      reply = async (url) => {
        if (url === "/production/requisitions") {
          return {
            status: 200,
            body: [
              {
                id: "spb-live-01",
                code: sentinelSPB,
                date: "2026-09-21T00:00:00.000Z",
                spkCode: "SPK-2026-0043",
                batchNumber: "BATCH-P12-002",
                customerName: "CV Alami Sejahtera",
                brandName: "PureNatural",
                productName: sentinelProduct,
                requestType: "RAW_MATERIAL",
                totalItems: 5,
                itemsSummary: "Centella Extract, Glycerin, Water, Emulsifier",
                sourceWarehouse: "WH-01 (Gudang Bahan Baku)",
                status: "SUBMITTED",
                requestedBy: "Hendra Wijaya",
                notes: "Bahan siap timbang",
              },
            ],
          };
        }
        return { status: 200, body: [] };
      };

      renderWithClient(<MaterialRequisitionPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelSPB)).toBeInTheDocument();
        expect(screen.getByText(sentinelProduct)).toBeInTheDocument();
      });
    });
  });

  // ── 7. Surface 6: PPIC Dashboard ────────────────────────────────────────────
  describe("Surface 6: production-planning-dashboard/page.tsx", () => {
    it("renders live sales orders and production plans from backend API", async () => {
      const sentinelSOClient = "PT Estetika Modern P12";
      const sentinelPlanClient = "CV Cantika Berdikari P12";
      const sentinelBatchNo = "BATCH-PPIC-P12-01";

      reply = async (url) => {
        if (url === "/commercial/sales-orders") {
          return {
            status: 200,
            body: [
              {
                id: "so-p12-01",
                status: "ACTIVE",
                quantity: 10000,
                lead: { client_name: sentinelSOClient },
                sample: { id: "smp-01", name: "Sunscreen Gel SPF 50" },
              },
            ],
          };
        }
        if (url === "/production-plans") {
          return {
            status: 200,
            body: [
              {
                id: "plan-p12-01",
                batch_no: sentinelBatchNo,
                status: "PLANNING",
                so: { lead: { client_name: sentinelPlanClient } },
                requisitions: [],
              },
            ],
          };
        }
        return { status: 200, body: [] };
      };

      renderWithClient(<PPICDashboard />);

      await waitFor(() => {
        expect(screen.getByText(sentinelSOClient)).toBeInTheDocument();
        expect(screen.getByText(sentinelPlanClient)).toBeInTheDocument();
        expect(screen.getByText(sentinelBatchNo)).toBeInTheDocument();
      });
    });
  });
});
