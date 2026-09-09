"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Wallet,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Lock,
  Building2,
  Calendar
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface PayrollItem {
  id: string;
  empId: string;
  empName: string;
  department: string;
  basicSalary: number;
  allowance: number;
  overtime: number;
  deductions: number;
  netSalary: number;
  bankAccount: string;
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "PAID";
}

const FALLBACK_PAYROLL: PayrollItem[] = [
  { id: "1", empId: "EMP-001", empName: "Budi Santoso", department: "Produksi", basicSalary: 6500000, allowance: 1200000, overtime: 850000, deductions: 250000, netSalary: 8300000, bankAccount: "BCA 521-998811", status: "APPROVED" },
  { id: "2", empId: "EMP-002", empName: "Rian Saputra", department: "R&D", basicSalary: 8000000, allowance: 1500000, overtime: 0, deductions: 320000, netSalary: 9180000, bankAccount: "Mandiri 137-009911", status: "APPROVED" },
  { id: "3", empId: "EMP-003", empName: "Siti Rahmawati", department: "QC", basicSalary: 5500000, allowance: 900000, overtime: 400000, deductions: 180000, netSalary: 6620000, bankAccount: "BCA 521-112233", status: "APPROVED" },
  { id: "4", empId: "EMP-004", empName: "Dewi Lestari", department: "BusDev", basicSalary: 7000000, allowance: 2000000, overtime: 0, deductions: 280000, netSalary: 8720000, bankAccount: "BCA 521-778899", status: "APPROVED" },
];

export default function HrPayrollPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("2026-09");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  const totalGross = FALLBACK_PAYROLL.reduce((acc, r) => acc + r.basicSalary + r.allowance + r.overtime, 0);
  const totalDeductions = FALLBACK_PAYROLL.reduce((acc, r) => acc + r.deductions, 0);
  const totalNet = FALLBACK_PAYROLL.reduce((acc, r) => acc + r.netSalary, 0);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Payroll Workbench & Penggajian (Salary Processing)"
        description="Kalkulasi otomatis gaji pokok, tunjangan keahlian, upah lembur, potongan BPJS/PPh 21, dan cetak slip gaji."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Payroll Batch Approved & Ready for Bank Transfer</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-medium"
            />
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Rekap
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Menjalankan Batch Transfer Gaji via Bank BCA...")}>
              <Wallet className="w-4 h-4 mr-1.5" />
              Transfer Batch Gaji
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Net Payroll"
          value={formatRupiah(totalNet)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Periode Sep 2026", isPositive: true }}
          subtext="Total Transfer ke 124 Pegawai"
          variant="success"
        />
        <DnaStatCard
          label="Total Gaji Pokok & Tunjangan"
          value={formatRupiah(totalGross)}
          icon={<Wallet className="w-5 h-5 text-blue-600" />}
          subtext="Gross Base & Allowances"
          variant="info"
        />
        <DnaStatCard
          label="Total Potongan (BPJS & Pajak)"
          value={formatRupiah(totalDeductions)}
          icon={<Building2 className="w-5 h-5 text-amber-600" />}
          delta={{ value: "BPJS TK & Kes", isPositive: true }}
          subtext="Disetorkan ke Kas Negara"
          variant="warning"
        />
        <DnaStatCard
          label="Status Batch Payroll"
          value="Disetujui 100%"
          icon={<CheckCircle2 className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Ready to Disburse", isPositive: true }}
          subtext="Disahkan GM & Direktur"
          variant="purple"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Daftar Rincian Penggajian Karyawan"
        badge={<DnaBadge variant="default">{FALLBACK_PAYROLL.length} Rekening</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari NIK / nama karyawan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">NIK</th>
                <th className="px-3.5 py-3">Nama Pegawai</th>
                <th className="px-3.5 py-3">Departemen</th>
                <th className="px-3.5 py-3 text-right">Gaji Pokok</th>
                <th className="px-3.5 py-3 text-right">Tunjangan</th>
                <th className="px-3.5 py-3 text-right">Lembur</th>
                <th className="px-3.5 py-3 text-right">Potongan</th>
                <th className="px-3.5 py-3 text-right">Gaji Bersih (THP)</th>
                <th className="px-3.5 py-3">Rekening Bank</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_PAYROLL.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 font-bold">{row.empId}</td>
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{row.empName}</td>
                  <td className="px-3.5 py-2.5 text-slate-600">{row.department}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-slate-800">{formatRupiah(row.basicSalary)}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-emerald-700">{formatRupiah(row.allowance)}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-blue-700">{row.overtime > 0 ? formatRupiah(row.overtime) : "-"}</td>
                  <td className="px-3.5 py-2.5 text-right font-medium text-rose-700">({formatRupiah(row.deductions)})</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-800 text-xs">{formatRupiah(row.netSalary)}</td>
                  <td className="px-3.5 py-2.5 font-mono text-slate-600 text-[11px]">{row.bankAccount}</td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton variant="secondary" size="sm" onClick={() => setSelectedSlip(row)}>
                      <Printer className="w-3.5 h-3.5 mr-1" />
                      Slip Gaji
                    </DnaButton>
                  </td>
                </tr>
              ))}
              <tr className="bg-emerald-50/75 font-black border-t-2 border-emerald-300">
                <td colSpan={3} className="px-3.5 py-3 text-emerald-950 font-black text-right">TOTAL PENGGAJIAN:</td>
                <td colSpan={4} className="px-3.5 py-3 text-right text-slate-600 font-bold">Net Total:</td>
                <td className="px-3.5 py-3 text-right text-emerald-950 font-black text-sm">{formatRupiah(totalNet)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* SLIP GAJI MODAL */}
      <DnaModal
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        title={`Slip Gaji Elektronik: ${selectedSlip?.empName} (${selectedSlip?.empId})`}
        size="md"
      >
        <div className="space-y-3.5 text-xs p-2">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <p className="font-bold text-slate-900 text-sm">PT AUREON COSMETICS INDONESIA</p>
              <p className="text-slate-500 text-[11px]">Kawasan Industri Manufaktur Kosmetik CPKB</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">LUNAS TRANSFER</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg">
            <div>Nama: <strong>{selectedSlip?.empName}</strong></div>
            <div>Departemen: <strong>{selectedSlip?.department}</strong></div>
            <div>NIK: <strong>{selectedSlip?.empId}</strong></div>
            <div>Rekening: <strong>{selectedSlip?.bankAccount}</strong></div>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Gaji Pokok:</span>
              <strong className="text-slate-900">{selectedSlip ? formatRupiah(selectedSlip.basicSalary) : "0"}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Tunjangan Keahlian & Transport:</span>
              <strong className="text-emerald-700">+{selectedSlip ? formatRupiah(selectedSlip.allowance) : "0"}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Upah Lembur Resmi:</span>
              <strong className="text-blue-700">+{selectedSlip ? formatRupiah(selectedSlip.overtime) : "0"}</strong>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span>Potongan BPJS & PPh 21:</span>
              <strong className="text-rose-700">-{selectedSlip ? formatRupiah(selectedSlip.deductions) : "0"}</strong>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 px-2 rounded-lg font-black text-sm text-emerald-950">
              <span>TOTAL TAKE HOME PAY (THP):</span>
              <span>{selectedSlip ? formatRupiah(selectedSlip.netSalary) : "0"}</span>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedSlip(null)}>
              Tutup
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              onClick={() => {
                toast.success("Mencetak Slip Gaji PDF...");
                window.print();
              }}
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Slip Gaji
            </DnaButton>
          </div>
        </div>
      </DnaModal>
    </DnaPageContainer>
  );
}
