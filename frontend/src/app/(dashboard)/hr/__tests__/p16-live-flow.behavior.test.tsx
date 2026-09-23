/**
 * P16 Acceptance Suite — Live P16 HR, Recruitment ATS, Attendance, Kasbon, KPI & Payroll UI Suite.
 *
 * Under test:
 *   - `master/hr-payroll/page.tsx` — Payroll Workbench & Detailed Salary Slip (Upah Tetap, Kasbon, 2-Col Transport, BPJS, PPh21)
 *   - `master/hr-attendance/page.tsx` — Presensi Live Attendance (Geofencing & Shift)
 *   - `master/hr-recruitment/page.tsx` — Recruitment ATS & Employee Demographics
 *   - `hr/kpi/page.tsx` — Performance Evaluation, KPI Scorecard & Incentive Bonuses
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/master/hr-payroll",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock dna toast
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

import HrPayrollPage from "@/app/(dashboard)/master/hr-payroll/page";
import HrAttendancePage from "@/app/(dashboard)/master/hr-attendance/page";
import HrRecruitmentPage from "@/app/(dashboard)/master/hr-recruitment/page";
import HrKpiPage from "@/app/(dashboard)/hr/kpi/page";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe("P16 Live Flow — Human Resources, Attendance, Kasbon & Payroll UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Payroll Workbench & Salary Slip (Sleepsalary)", () => {
    it("renders payroll overview with KPI cards and employee payroll table", () => {
      renderWithClient(<HrPayrollPage />);

      expect(screen.getByText(/Payroll Workbench & Penggajian/i)).toBeInTheDocument();
      expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
      expect(screen.getByText(/Rian Saputra/i)).toBeInTheDocument();
    });

    it("opens detailed Salary Slip modal with Upah Tetap, 2-Col Transport, Kasbon reminder, BPJS and PPh21", async () => {
      renderWithClient(<HrPayrollPage />);

      // Click first "Slip Gaji" button
      const slipButtons = screen.getAllByRole("button", { name: /Slip Gaji/i });
      fireEvent.click(slipButtons[0]);

      // Check modal rendered
      expect(screen.getByText(/PT\. KALOPSIA AUREON PHARMA/i)).toBeInTheDocument();
      expect(screen.getByText(/SLIP GAJI RESMI • PERIODE/i)).toBeInTheDocument();

      // Check Upah Tetap (Pokok + Jabatan)
      expect(screen.getByText(/Upah Tetap \(Pokok \+ Jabatan\):/i)).toBeInTheDocument();

      // Check 2-Col Transport
      expect(screen.getByText(/Transport \(Flat\):/i)).toBeInTheDocument();
      expect(screen.getByText(/Transport \(Tentatif\/Kehadiran\):/i)).toBeInTheDocument();

      // Check Kasbon loan reminder
      expect(screen.getByText(/Potongan Kasbon \(Pinjaman\):/i)).toBeInTheDocument();
      expect(screen.getByText(/Sisa Pinjaman Berjalan:/i)).toBeInTheDocument();

      // Check BPJS columns
      expect(screen.getByText(/BPJS Kesehatan/i)).toBeInTheDocument();
      expect(screen.getByText(/BPJS Ketenagakerjaan/i)).toBeInTheDocument();

      // Check PPh 21
      expect(screen.getByText(/PPh 21 \(Di atas UMR\):/i)).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByRole("button", { name: /Tutup/i });
      fireEvent.click(closeButton);
    });
  });

  describe("2. Presensi Live Attendance (Geofencing)", () => {
    it("renders attendance monitor with geofence badge and employee attendance entries", () => {
      renderWithClient(<HrAttendancePage />);

      expect(screen.getByText(/Presensi Live Attendance/i)).toBeInTheDocument();
      expect(screen.getByText(/Geofence Pabrik: Radius 50m Aktif/i)).toBeInTheDocument();
      expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
    });

    it("filters attendance by search keyword", () => {
      renderWithClient(<HrAttendancePage />);

      const searchInput = screen.getByPlaceholderText(/Cari nama atau NIK/i);
      fireEvent.change(searchInput, { target: { value: "Rian Saputra" } });

      expect(screen.getByText(/Rian Saputra/i)).toBeInTheDocument();
      expect(screen.queryByText(/Budi Santoso/i)).not.toBeInTheDocument();
    });
  });

  describe("3. Recruitment ATS & Demographics", () => {
    it("renders recruitment pipeline with ATS stages and candidate list", () => {
      renderWithClient(<HrRecruitmentPage />);

      expect(screen.getByText(/Pegawai & Rekrutmen/i)).toBeInTheDocument();
      expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
    });
  });

  describe("4. KPI Scorecards & Performance Evaluation", () => {
    it("renders KPI evaluation matrix, grading, and performance metrics", () => {
      renderWithClient(<HrKpiPage />);

      expect(screen.getByText(/Evaluasi Kinerja & KPI Karyawan/i)).toBeInTheDocument();
      expect(screen.getByText(/Rata-rata Skor KPI Pabrik/i)).toBeInTheDocument();
      expect(screen.getByText(/Matriks Evaluasi Kinerja Karyawan & Pembobotan/i)).toBeInTheDocument();
    });
  });
});
