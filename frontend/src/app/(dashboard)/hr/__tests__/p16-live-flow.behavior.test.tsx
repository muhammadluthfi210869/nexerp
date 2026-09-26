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
import { api } from "@/lib/api";

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

const MOCK_PAYROLLS = [
  {
    id: "PAY-01",
    employee: {
      nik: "KIL-2022-001",
      name: "Budi Santoso",
      department: "Produksi Mixing",
      role: "Supervisor Produksi",
      bankName: "BCA",
      bankAccount: "521-0099881",
    },
    basicSalary: 6500000,
    allowance: 1200000,
    overtimePay: 850000,
    loanDeduction: 500000,
    remainingLoan: 1500000,
    netSalary: 8640000,
    status: "APPROVED",
  },
  {
    id: "PAY-02",
    employee: {
      nik: "KIL-2023-014",
      name: "Rian Saputra",
      department: "R&D Formulasi",
      role: "Senior Formulator",
      bankName: "Bank Mandiri",
      bankAccount: "137-0099112",
    },
    basicSalary: 8000000,
    allowance: 1500000,
    overtimePay: 0,
    loanDeduction: 0,
    remainingLoan: 0,
    netSalary: 10020000,
    status: "APPROVED",
  },
];

const MOCK_ATTENDANCE = [
  {
    id: "att-1",
    employee: {
      nik: "KIL-2022-001",
      name: "Budi Santoso",
      department: "Produksi Mixing",
    },
    shift: "Shift 1 (07:00 - 15:30)",
    clockIn: "2026-09-09T06:48:00Z",
    clockOut: "2026-09-09T15:35:00Z",
    distanceMeters: 12,
    latitude: -6.2088,
    longitude: 106.8456,
    isLate: false,
  },
  {
    id: "att-2",
    employee: {
      nik: "KIL-2023-014",
      name: "Rian Saputra",
      department: "R&D Formulasi",
    },
    shift: "Office (08:00 - 17:00)",
    clockIn: "2026-09-09T07:52:00Z",
    clockOut: "2026-09-09T17:05:00Z",
    distanceMeters: 18,
    latitude: -6.2088,
    longitude: 106.8456,
    isLate: false,
  },
];

const MOCK_EMPLOYEES = [
  {
    id: "emp-1",
    nik: "KIL-2022-001",
    name: "Budi Santoso",
    department: "Produksi Mixing",
    role: "Supervisor Produksi",
    joinedAt: "2022-01-15T00:00:00Z",
    isActive: true,
    email: "budi.santoso@kalopsia.id",
  },
  {
    id: "emp-2",
    nik: "KIL-2023-014",
    name: "Rian Saputra",
    department: "R&D Formulasi",
    role: "Senior Formulator",
    joinedAt: "2023-03-01T00:00:00Z",
    isActive: true,
    email: "rian.s@kalopsia.id",
  },
];

const MOCK_CANDIDATES = [
  {
    id: "cnd-1",
    name: "Calon Operator",
    appliedRole: "Operator",
    department: "Produksi",
    stage: "SCREENING",
    status: "ACTIVE",
  },
];

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
    vi.restoreAllMocks();
    vi.spyOn(api, "get").mockImplementation((url: string) => {
      if (url.includes("/hr/payrolls")) {
        return Promise.resolve({ data: MOCK_PAYROLLS });
      }
      if (url.includes("/hr/attendance")) {
        return Promise.resolve({ data: MOCK_ATTENDANCE });
      }
      if (url.includes("/hr/employees")) {
        return Promise.resolve({ data: MOCK_EMPLOYEES });
      }
      if (url.includes("/hr/candidates")) {
        return Promise.resolve({ data: MOCK_CANDIDATES });
      }
      return Promise.resolve({ data: [] });
    });
  });

  describe("1. Payroll Workbench & Salary Slip (Sleepsalary)", () => {
    it("renders payroll overview with KPI cards and employee payroll table", async () => {
      renderWithClient(<HrPayrollPage />);

      expect(screen.getByText(/Payroll Workbench & Penggajian/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
        expect(screen.getByText(/Rian Saputra/i)).toBeInTheDocument();
      });
    });

    it("opens detailed Salary Slip modal with Upah Tetap, 2-Col Transport, Kasbon reminder, BPJS and PPh21", async () => {
      renderWithClient(<HrPayrollPage />);

      await waitFor(() => {
        expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
      });

      // Click first "Slip" button
      const slipButtons = screen.getAllByRole("button", { name: /Slip/i });
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
    it("renders attendance monitor with geofence badge and employee attendance entries", async () => {
      renderWithClient(<HrAttendancePage />);

      expect(screen.getByText(/Presensi Live Attendance/i)).toBeInTheDocument();
      expect(screen.getByText(/Geofence Pabrik: Radius 50m Aktif/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
      });
    });

    it("filters attendance by search keyword", async () => {
      renderWithClient(<HrAttendancePage />);

      await waitFor(() => {
        expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Cari nama atau NIK/i);
      fireEvent.change(searchInput, { target: { value: "Rian Saputra" } });

      await waitFor(() => {
        expect(screen.getByText(/Rian Saputra/i)).toBeInTheDocument();
        expect(screen.queryByText(/Budi Santoso/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("3. Recruitment ATS & Demographics", () => {
    it("renders recruitment pipeline with ATS stages and candidate list", async () => {
      renderWithClient(<HrRecruitmentPage />);

      expect(screen.getByText(/Pegawai & Rekrutmen/i)).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText(/Budi Santoso/i)).toBeInTheDocument();
      });
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
