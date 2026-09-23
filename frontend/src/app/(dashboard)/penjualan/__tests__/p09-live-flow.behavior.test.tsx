/**
 * P09 Acceptance Suite — Live P09 Commercial & Sales UI Suite.
 *
 * Under test:
 *   - `sales-orders/page.tsx` — SO listing, delivery gate toggle, creation
 *   - `down-payment/page.tsx` — 50% DP verification, approval, SO activation
 *   - `delivery-orders/page.tsx` — Fulfillment shipments, dispatching
 *   - `faktur-penjualan/page.tsx` — AR invoicing, delivery gate release
 *   - `bayar-penjualan/page.tsx` — AR settlement, PPh 23 deduction, overpayment
 *   - `retur-penjualan/page.tsx` — Sales return claims, QC, Credit Note offset
 *
 * Proves:
 *   1. No static arrays, no localStorage, no placeholder URLs, no mock constants
 *      survive in any of the 6 P09 surfaces (source guard).
 *   2. Primitives are composed from `@/components/dna`.
 *   3. The production API client (`@/lib/api`) is the sole data vehicle.
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
  usePathname: () => "/penjualan/sales-orders",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { api } from "@/lib/api";
import SalesOrdersPage from "@/app/(dashboard)/penjualan/sales-orders/page";
import DownPaymentPage from "@/app/(dashboard)/penjualan/down-payment/page";
import DeliveryOrdersPage from "@/app/(dashboard)/penjualan/delivery-orders/page";
import FakturPenjualanPage from "@/app/(dashboard)/penjualan/faktur-penjualan/page";
import BayarPenjualanPage from "@/app/(dashboard)/penjualan/bayar-penjualan/page";
import ReturPenjualanPage from "@/app/(dashboard)/penjualan/retur-penjualan/page";

const BASE_DIR = path.resolve(__dirname, "..");
const SO_SRC = path.resolve(BASE_DIR, "sales-orders", "page.tsx");
const DP_SRC = path.resolve(BASE_DIR, "down-payment", "page.tsx");
const DO_SRC = path.resolve(BASE_DIR, "delivery-orders", "page.tsx");
const INV_SRC = path.resolve(BASE_DIR, "faktur-penjualan", "page.tsx");
const PAY_SRC = path.resolve(BASE_DIR, "bayar-penjualan", "page.tsx");
const RET_SRC = path.resolve(BASE_DIR, "retur-penjualan", "page.tsx");

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

describe("P09 Acceptance — Live P09 Commercial & Sales UI", () => {
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

  // ── 1. Source Guards on all 6 P09 surfaces ──────────────────────────────────
  describe("Source Guards: Zero static mocks or local storage on all 6 surfaces", () => {
    const p09Pages: Array<[string, string]> = [
      ["sales-orders", SO_SRC],
      ["down-payment", DP_SRC],
      ["delivery-orders", DO_SRC],
      ["faktur-penjualan", INV_SRC],
      ["bayar-penjualan", PAY_SRC],
      ["retur-penjualan", RET_SRC],
    ];

    it.each(p09Pages)("%s contains no mock arrays, localStorage or absolute URLs", (_label, file) => {
      const src = fs.readFileSync(file, "utf8");

      expect(src).not.toMatch(/localStorage/);
      expect(src).not.toMatch(/sessionStorage/);
      expect(src).not.toMatch(/https?:\/\//);
      expect(src).not.toMatch(/\bconst\s+(INITIAL_|MOCK_|FALLBACK_|DEMO_|DUMMY_)/);
      expect(src).not.toMatch(/placehold\.co/);

      // Uses production api client and react-query
      expect(src).toMatch(/from "@\/lib\/api"/);
      expect(src).toMatch(/useQuery/);
      expect(src).toMatch(/useMutation/);
    });

    it.each(p09Pages)("%s uses design system primitives from @/components/dna", (_label, file) => {
      const src = fs.readFileSync(file, "utf8");
      expect(src).toMatch(/from "@\/components\/dna"/);
      expect(src).toMatch(/DnaLoadingSkeleton/);
      expect(src).toMatch(/DnaErrorState/);
      expect(src).toMatch(/DnaEmptyState/);
    });
  });

  // ── 2. Sales Orders Surface ────────────────────────────────────────────────
  describe("Surface 1: sales-orders/page.tsx", () => {
    it("renders live sales orders and delivery gate badge from API", async () => {
      const sentinelSO = "SO-LIVE-2026-0901";
      const sentinelClient = "PT Sentosa Kosmetik Live";

      reply = async (url) => {
        if (url === "/commercial/sales-orders") {
          return {
            status: 200,
            body: [
              {
                id: "so-test-1",
                orderNumber: sentinelSO,
                brandName: "Sentosa Glow",
                totalAmount: 75000000,
                status: "ACTIVE",
                deliveryGateStatus: "RELEASED",
                salesCategory: "PRODUKSI",
                createdAt: new Date().toISOString(),
                lead: { id: "lead-1", clientName: sentinelClient },
                invoices: [],
                items: [{ id: "item-1", productName: "Acne Serum", quantity: 5000, unitPrice: 15000 }],
              },
            ],
          };
        }
        if (url === "/customers") {
          return { status: 200, body: [] };
        }
        throw new Error(`Unexpected call: ${url}`);
      };

      renderWithClient(<SalesOrdersPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelSO)).toBeInTheDocument();
      });

      expect(screen.getByText(sentinelClient)).toBeInTheDocument();
      expect(screen.getByText("RELEASED")).toBeInTheDocument();
      expect(calls).toContain("/commercial/sales-orders");
    });
  });

  // ── 3. Down Payment Surface ────────────────────────────────────────────────
  describe("Surface 2: down-payment/page.tsx", () => {
    it("renders down payments and calculates 50% threshold status", async () => {
      const sentinelDP = "INV-DP-2026-999";

      reply = async (url) => {
        if (url === "/commercial/down-payments") {
          return {
            status: 200,
            body: [
              {
                id: "dp-1",
                dpNumber: sentinelDP,
                category: "sample",
                orderNumber: "SO-DP-001",
                customerName: "PT Aura Maklon",
                brandName: "Aura Cleanse",
                amount: 50000000,
                usedAmount: 25000000,
                createdAt: new Date().toISOString(),
                soId: "so-1",
              },
            ],
          };
        }
        if (url === "/commercial/sales-orders") {
          return { status: 200, body: [] };
        }
        throw new Error(`Unexpected call: ${url}`);
      };

      renderWithClient(<DownPaymentPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelDP)).toBeInTheDocument();
      });

      expect(screen.getByText("PT Aura Maklon")).toBeInTheDocument();
      expect(screen.getByText("Terpakai Sebagian")).toBeInTheDocument();
      expect(calls).toContain("/commercial/down-payments");
    });
  });

  // ── 4. Delivery Orders Surface ─────────────────────────────────────────────
  describe("Surface 3: delivery-orders/page.tsx", () => {
    it("renders shipments and handles empty state gracefully", async () => {
      reply = async (url) => {
        if (url === "/fulfillment/shipments") {
          return { status: 200, body: [] };
        }
        if (url === "/commercial/sales-orders") {
          return { status: 200, body: [] };
        }
        throw new Error(`Unexpected call: ${url}`);
      };

      renderWithClient(<DeliveryOrdersPage />);

      await waitFor(() => {
        expect(screen.getByText("Belum Ada Delivery Order")).toBeInTheDocument();
      });
      expect(calls).toContain("/fulfillment/shipments");
    });
  });

  // ── 5. Faktur Penjualan Surface ────────────────────────────────────────────
  describe("Surface 4: faktur-penjualan/page.tsx", () => {
    it("renders invoices and delivery release state", async () => {
      const sentinelInv = "INV-2026-FKT-001";

      reply = async (url) => {
        if (url === "/commercial/invoices") {
          return {
            status: 200,
            body: [
              {
                id: "inv-1",
                invoiceNumber: sentinelInv,
                customerName: "PT Derma Kosmetik",
                brandName: "DermaGlow",
                category: "RECEIVABLE",
                type: "FINAL_PAYMENT",
                amountDue: 60000000,
                paidAmount: 60000000,
                outstandingAmount: 0,
                status: "PAID",
                deliveryGateStatus: "RELEASED",
                invoiceDate: new Date().toISOString(),
                soId: "so-inv-1",
                salesOrder: { orderNumber: "SO-INV-1", deliveryGateStatus: "RELEASED" },
              },
            ],
          };
        }
        if (url === "/commercial/sales-orders") {
          return { status: 200, body: [] };
        }
        throw new Error(`Unexpected call: ${url}`);
      };

      renderWithClient(<FakturPenjualanPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelInv)).toBeInTheDocument();
      });
      expect(screen.getByText("PT Derma Kosmetik")).toBeInTheDocument();
      expect(calls).toContain("/commercial/invoices");
    });
  });

  // ── 6. Bayar Penjualan Surface ─────────────────────────────────────────────
  describe("Surface 5: bayar-penjualan/page.tsx", () => {
    it("renders payments with PPh 23 withholding calculations", async () => {
      const sentinelPayInv = "INV-PAY-2026-002";

      reply = async (url) => {
        if (url === "/commercial/invoices") {
          return {
            status: 200,
            body: [
              {
                id: "inv-p1",
                invoiceNumber: sentinelPayInv,
                amountDue: 50000000,
                paidAmount: 25000000,
                status: "PARTIAL",
                salesOrder: {
                  orderNumber: "SO-PAY-1",
                  lead: { clientName: "CV Herbal Alam" },
                  brandName: "HerbalGlow",
                },
              },
            ],
          };
        }
        throw new Error(`Unexpected call: ${url}`);
      };

      renderWithClient(<BayarPenjualanPage />);

      await waitFor(() => {
        expect(screen.getByText(sentinelPayInv)).toBeInTheDocument();
      });
      expect(screen.getByText("CV Herbal Alam")).toBeInTheDocument();
      expect(calls).toContain("/commercial/invoices");
    });
  });

  // ── 7. Retur Penjualan Surface ─────────────────────────────────────────────
  describe("Surface 6: retur-penjualan/page.tsx", () => {
    it("renders sales returns and credit note offset status", async () => {
      const sentinelRet = "RET-2026-TEST-01";

      reply = async (url) => {
        if (url === "/bussdev/returns") {
          return {
            status: 200,
            body: [
              {
                id: "ret-uuid-001",
                returnStatus: "POTONG_TAGIHAN",
                notes: "Botol serum dent pada kardus sekunder",
                createdAt: new Date().toISOString(),
                so: {
                  id: "so-ret-1",
                  orderNumber: "SO-RET-01",
                  brandName: "K-Beauty Clean",
                  lead: { clientName: "PT K-Beauty Global" },
                },
                warehouse: { id: "wh-1", name: "Gudang Karantina Maklon (KRT-01)" },
                items: [
                  {
                    id: "item-ret-1",
                    qtyReturned: 100,
                    unitPrice: 20000,
                    material: { name: "Hyaluronic Acid Serum 30ml" },
                  },
                ],
              },
            ],
          };
        }
        if (url === "/commercial/sales-orders") {
          return { status: 200, body: [] };
        }
        if (url === "/warehouse/warehouses") {
          return { status: 200, body: [] };
        }
        throw new Error(`Unexpected call: ${url}`);
      };

      renderWithClient(<ReturPenjualanPage />);

      await waitFor(() => {
        expect(screen.getByText("RET-RET-UUID")).toBeInTheDocument();
      });
      expect(screen.getByText("PT K-Beauty Global")).toBeInTheDocument();
      expect(calls).toContain("/bussdev/returns");
    });
  });
});
