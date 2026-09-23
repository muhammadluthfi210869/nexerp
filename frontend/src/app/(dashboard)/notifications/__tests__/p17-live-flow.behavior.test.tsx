/**
 * P17 Acceptance Suite — Live Documents, Communication, Integrations & Automation UI Suite.
 *
 * Under test:
 *   - `notifications/page.tsx` — Pusat Notifikasi & Filter (SCR-136)
 *   - `notifications/[id]/page.tsx` — Detail Notifikasi & Action Link (SCR-137)
 *   - `settings/notifications/page.tsx` — Preferensi Notifikasi & Saluran (SCR-138)
 *   - `settings/templates/page.tsx` — Dokumen Cetak, Email & WhatsApp Templates (SCR-145)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/notifications",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "notif-uuid-1" }),
}));

// Mock dna toast
vi.mock("@/components/dna", async () => {
  const actual = await vi.importActual<typeof import("@/components/dna")>("@/components/dna");
  return {
    ...actual,
    useDnaToast: () => ({
      toast: vi.fn(),
    }),
  };
});

import NotificationsPage from "@/app/(dashboard)/notifications/page";
import NotificationDetailPage from "@/app/(dashboard)/notifications/[id]/page";
import NotificationPreferencesPage from "@/app/(dashboard)/settings/notifications/page";
import TemplatesPage from "@/app/(dashboard)/settings/templates/page";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("P17 Live Flow — Documents, Communication, Integrations & Notifications UI", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Pusat Notifikasi Masuk (SCR-136)", () => {
    it("renders notification hub with KPI cards and live notification entries", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          data: [
            {
              id: "notif-1",
              userId: "user-1",
              title: "Mention baru di SalesOrder",
              body: "@andi tolong review SO ini secepatnya",
              type: "MENTION",
              referenceType: "SalesOrder",
              referenceId: "so-123",
              link: "/penjualan/so-123",
              isRead: false,
              createdAt: new Date().toISOString(),
            },
            {
              id: "notif-2",
              userId: "user-1",
              title: "SLA Warning: Approval Tertunda",
              body: "Persetujuan PO-456 idle lebih dari 12 jam",
              type: "SLA_WARNING",
              referenceType: "PurchaseOrder",
              referenceId: "po-456",
              link: "/pembelian/po-456",
              isRead: true,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      } as any);

      renderWithClient(<NotificationsPage />);

      expect(screen.getByText(/Pusat Notifikasi & Aktivitas/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Notifikasi/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Belum Dibaca/i).length).toBeGreaterThan(0);

      await waitFor(() => {
        expect(screen.getByText("Mention baru di SalesOrder")).toBeInTheDocument();
        expect(screen.getByText("SLA Warning: Approval Tertunda")).toBeInTheDocument();
      });
    });
  });

  describe("2. Detail Notifikasi (SCR-137)", () => {
    it("renders detailed notification message and navigation action link", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          data: {
            id: "notif-uuid-1",
            userId: "user-1",
            title: "Urgent: Eskalasi SLA Purchase Order",
            body: "Dokumen PO-789 telah melampaui batas SLA 24 jam tanpa approval.",
            type: "SLA_BREACH",
            referenceType: "PurchaseOrder",
            referenceId: "po-uuid-789",
            link: "/pembelian/orders/po-uuid-789",
            isRead: false,
            createdAt: new Date().toISOString(),
          },
        },
      } as any);
      vi.spyOn(api, "post").mockResolvedValueOnce({ data: { success: true } } as any);

      renderWithClient(<NotificationDetailPage />);

      await waitFor(() => {
        expect(screen.getByText("Urgent: Eskalasi SLA Purchase Order")).toBeInTheDocument();
        expect(
          screen.getByText(/Dokumen PO-789 telah melampaui batas SLA 24 jam/i),
        ).toBeInTheDocument();
        expect(screen.getByText("Buka Halaman Terkait")).toBeInTheDocument();
      });
    });
  });

  describe("3. Preferensi Notifikasi & Saluran Komunikasi (SCR-138)", () => {
    it("renders communication channels and toggle preferences", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          data: {
            in_app: true,
            email_digest: true,
            whatsapp_alerts: false,
            sla_warnings: true,
            quiet_hours_enabled: false,
          },
        },
      } as any);

      renderWithClient(<NotificationPreferencesPage />);

      expect(screen.getByText(/Preferensi Notifikasi/i)).toBeInTheDocument();
      expect(screen.getByText(/Notifikasi In-App & Badge/i)).toBeInTheDocument();
      expect(screen.getByText(/Pemberitahuan WhatsApp Otomatis/i)).toBeInTheDocument();
      expect(screen.getByText(/Peringatan Keterlambatan SLA/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Simpan Pengaturan/i })).toBeInTheDocument();
      });
    });
  });

  describe("4. Template Dokumen Cetak & Pesan Otomatis (SCR-145)", () => {
    it("renders document, email, and WhatsApp template listings", async () => {
      vi.spyOn(api, "get").mockResolvedValueOnce({
        data: {
          data: [
            { id: "tmpl-quotation", name: "Standard Quotation Template", type: "QUOTATION", format: "PDF", active: true },
            { id: "tmpl-invoice-dp", name: "Faktur Uang Muka (DP)", type: "INVOICE_DP", format: "PDF", active: true },
          ],
        },
      } as any);

      renderWithClient(<TemplatesPage />);

      expect(screen.getByText(/Template Dokumen & Komunikasi/i)).toBeInTheDocument();
      expect(screen.getByText(/Dokumen Cetak & PDF/i)).toBeInTheDocument();
      expect(screen.getByText(/Template Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Template WhatsApp/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Standard Quotation Template")).toBeInTheDocument();
        expect(screen.getByText("Faktur Uang Muka (DP)")).toBeInTheDocument();
      });
    });
  });
});
