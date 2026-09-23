"use client";

import React, { useState, useMemo } from "react";
import {
  Wallet,
  DollarSign,
  FileSpreadsheet,
  Printer,
  Search,
  Eye,
  CheckCircle2,
  Lock,
  Building2,
  Calendar,
  Send,
  Download,
  CreditCard
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaTable,
  DnaCell
} from "@/components/dna";

interface PayrollItem {
  id: string;
  empId: string;
  empName: string;
  department: string;
  role: string;
  basicSalary: number;
  allowance: number;
  transportFlat?: number;
  transportTentative?: number;
  overtimePay: number;
  bpjsDeduction: number;
  bpjsHealth?: number;
  bpjsEmployment?: number;
  loanDeduction?: number;
  remainingLoan?: number;
  taxPph21: number;
  lateDeduction: number;
  netSalary: number;
  bankName: string;
  bankAccount: string;
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "PAID";
}

const INITIAL_PAYROLL: PayrollItem[] = [
  { id: "PAY-01", empId: "KIL-2022-001", empName: "Budi Santoso, S.T", department: "Produksi Mixing", role: "Supervisor Produksi", basicSalary: 6500000, allowance: 1200000, transportFlat: 500000, transportTentative: 440000, overtimePay: 850000, bpjsDeduction: 260000, bpjsHealth: 77000, bpjsEmployment: 154000, loanDeduction: 500000, remainingLoan: 1500000, taxPph21: 150000, lateDeduction: 0, netSalary: 8640000, bankName: "BCA", bankAccount: "521-0099881", status: "APPROVED" },
  { id: "PAY-02", empId: "KIL-2023-014", empName: "Rian Saputra, S.Farm", department: "R&D Formulasi", role: "Senior Formulator", basicSalary: 8000000, allowance: 1500000, transportFlat: 500000, transportTentative: 550000, overtimePay: 0, bpjsDeduction: 320000, bpjsHealth: 95000, bpjsEmployment: 190000, loanDeduction: 0, remainingLoan: 0, taxPph21: 210000, lateDeduction: 0, netSalary: 10020000, bankName: "Bank Mandiri", bankAccount: "137-0099112", status: "APPROVED" },
  { id: "PAY-03", empId: "KIL-2023-022", empName: "Siti Rahmawati, S.Si", department: "QC Mikrobiologi", role: "Analis Kimia & QC", basicSalary: 5500000, allowance: 900000, transportFlat: 400000, transportTentative: 440000, overtimePay: 450000, bpjsDeduction: 220000, bpjsHealth: 64000, bpjsEmployment: 128000, loanDeduction: 250000, remainingLoan: 750000, taxPph21: 90000, lateDeduction: 50000, netSalary: 6880000, bankName: "BCA", bankAccount: "521-1122334", status: "APPROVED" },
  { id: "PAY-04", empId: "KIL-2024-005", empName: "Dewi Lestari, S.E", department: "BusDev Maklon", role: "Senior AE BusDev", basicSalary: 7000000, allowance: 2000000, transportFlat: 600000, transportTentative: 500000, overtimePay: 0, bpjsDeduction: 280000, bpjsHealth: 90000, bpjsEmployment: 180000, loanDeduction: 0, remainingLoan: 0, taxPph21: 180000, lateDeduction: 0, netSalary: 9640000, bankName: "BCA", bankAccount: "521-7788990", status: "APPROVED" },
  { id: "PAY-05", empId: "KIL-2024-031", empName: "Ahmad Dani", department: "Gudang Inbound", role: "Staff Inbound", basicSalary: 4800000, allowance: 600000, transportFlat: 300000, transportTentative: 400000, overtimePay: 350000, bpjsDeduction: 192000, bpjsHealth: 54000, bpjsEmployment: 108000, loanDeduction: 200000, remainingLoan: 400000, taxPph21: 0, lateDeduction: 0, netSalary: 6058000, bankName: "BRI", bankAccount: "012-3344556", status: "APPROVED" },
  { id: "PAY-06", empId: "KIL-2025-012", empName: "dr. Amanda Putri, M.Biomed", department: "QA & APJ", role: "Apoteker PJ", basicSalary: 11000000, allowance: 2500000, transportFlat: 800000, transportTentative: 600000, overtimePay: 0, bpjsDeduction: 440000, bpjsHealth: 135000, bpjsEmployment: 270000, loanDeduction: 0, remainingLoan: 0, taxPph21: 480000, lateDeduction: 0, netSalary: 13980000, bankName: "BCA", bankAccount: "521-9988776", status: "APPROVED" },
];

export default function HrPayrollPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("2026-09");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSlip, setSelectedSlip] = useState<PayrollItem | null>(null);

  const totalBasic = INITIAL_PAYROLL.reduce((acc, r) => acc + r.basicSalary, 0);
  const totalAllowances = INITIAL_PAYROLL.reduce((acc, r) => acc + r.allowance + r.overtimePay, 0);
  const totalDeductions = INITIAL_PAYROLL.reduce((acc, r) => acc + r.bpjsDeduction + r.taxPph21 + r.lateDeduction, 0);
  const totalNetPayroll = INITIAL_PAYROLL.reduce((acc, r) => acc + r.netSalary, 0);

  const filteredPayroll = useMemo(() => {
    return INITIAL_PAYROLL.filter(r => {
      const matchSearch =
        r.empName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || r.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [searchQuery, deptFilter]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Payroll Workbench & Penggajian (Salary Processing)"
        description="Kalkulasi otomatis gaji pokok, tunjangan keahlian, upah lembur SPL, pemotongan iuran BPJS & PPh 21, dan cetak slip gaji resmi."
        tabs={[
          { id: "ALL", label: "Semua Karyawan" },
          { id: "Produksi", label: "Produksi" },
          { id: "R&D", label: "R&D" },
          { id: "QC", label: "QC & QA" },
          { id: "BusDev", label: "BusDev" },
          { id: "Gudang", label: "Warehouse" }
        ]}
        activeTab={deptFilter}
        onTabChange={setDeptFilter}
        actions={
          <div className="flex items-center gap-2">
            <DnaInput
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-semibold"
            />
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Rekap
            </DnaButton>
            <DnaButton variant="secondary" size="md" onClick={() => toast.success("Exporting Rekap Payroll ke Excel...")}>
              <FileSpreadsheet className="w-4 h-4 mr-1.5" />
              Export Excel
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Batch Transfer Penggajian Berhasil Dikirim ke Host-to-Host Bank BCA!")}>
              <CreditCard className="w-4 h-4 mr-1.5" />
              Transfer Batch Gaji
            </DnaButton>
          </div>
        }
      />

      {/* KPI STAT CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Net Take Home Pay"
          value={formatRupiah(totalNetPayroll)}
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "Periode Sep 2026", isPositive: true }}
          subtext="Total Dana Gaji Karyawan Bersih"
          variant="success"
        />
        <DnaStatCard
          label="Total Gaji Pokok"
          value={formatRupiah(totalBasic)}
          icon={<Wallet className="w-5 h-5 text-blue-600" />}
          subtext="Akumulasi Basic Salary"
          variant="info"
        />
        <DnaStatCard
          label="Tunjangan & Lembur SPL"
          value={formatRupiah(totalAllowances)}
          icon={<Calendar className="w-5 h-5 text-purple-600" />}
          delta={{ value: "Overtime: +Rp 1.65 Jt", isPositive: true }}
          subtext="Tunjangan Keahlian & Jam Lembur"
          variant="purple"
        />
        <DnaStatCard
          label="Total Potongan (BPJS & Pajak)"
          value={formatRupiah(totalDeductions)}
          icon={<Building2 className="w-5 h-5 text-amber-600" />}
          subtext="BPJS Kes/TK & PPh 21 Pasal 21"
          variant="warning"
        />
      </DnaKpiGrid>

      {/* DATA TABLE */}
      <DnaDataTableCard
        customToolbar={
          <div className="flex items-center justify-between w-full">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari nama, NIK, atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Menampilkan <span className="font-semibold text-slate-800">{filteredPayroll.length}</span> Karyawan Terdaftar
            </div>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 h-[40px] text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="px-3.5 py-2.5 w-[110px]">NIK</th>
                <th className="px-3.5 py-2.5">Karyawan</th>
                <th className="px-3.5 py-2.5">Posisi & Divisi</th>
                <th className="px-3.5 py-2.5">Rekening Bank</th>
                <th className="px-3.5 py-2.5 text-right">Gaji Pokok</th>
                <th className="px-3.5 py-2.5 text-right">Tunjangan</th>
                <th className="px-3.5 py-2.5 text-right">Lembur</th>
                <th className="px-3.5 py-2.5 text-right">Potongan</th>
                <th className="px-3.5 py-2.5 text-right">Take Home Pay</th>
                <th className="px-3.5 py-2.5 text-center">Status</th>
                <th className="px-3.5 py-2.5 text-center w-[90px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayroll.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3.5 py-8 text-center text-[12px] text-slate-400">
                    Tidak ada catatan payroll yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredPayroll.map((item) => (
                  <tr key={item.id} className="h-[48px] hover:bg-slate-50/80 transition-colors">
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Code>{item.empId}</DnaCell.Code>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-semibold text-slate-900">{item.empName}</DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.NaturalPair
                        primary={item.role}
                        secondary={item.department}
                      />
                    </td>
                    <td className="px-3.5 py-2.5">
                      <DnaCell.Text className="font-mono text-[11.5px] text-slate-600">
                        {item.bankName} {item.bankAccount}
                      </DnaCell.Text>
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={item.basicSalary} prefix="Rp " />
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={item.allowance} prefix="Rp " />
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric value={item.overtimePay} prefix="Rp " className="text-emerald-700" />
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric
                        value={item.bpjsDeduction + item.taxPph21 + item.lateDeduction}
                        prefix="-Rp "
                        className="text-rose-600"
                      />
                    </td>
                    <td className="px-3.5 py-2.5 text-right">
                      <DnaCell.Numeric
                        value={item.netSalary}
                        prefix="Rp "
                        className="font-bold text-emerald-700"
                      />
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <DnaBadge variant="success">{item.status}</DnaBadge>
                    </td>
                    <td className="px-3.5 py-2.5 text-center">
                      <DnaButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSlip(item)}
                        title="Lihat Slip Gaji"
                        aria-label="Slip Gaji"
                        className="h-7 px-2 text-[11px]"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1 text-blue-600" />
                        Slip
                      </DnaButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* QUICK PEEK DRAWER: SLIP GAJI RESMI */}
      <DnaDetailDrawer
        isOpen={!!selectedSlip}
        onClose={() => setSelectedSlip(null)}
        title={selectedSlip?.empName || "Slip Gaji Karyawan"}
        subtitle={`${selectedSlip?.empId} • ${selectedSlip?.role}`}
        badge={
          selectedSlip ? (
            <DnaBadge variant="success">Lunas Transfer</DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "earnings",
            label: "Rincian Pendapatan & Potongan",
            content: selectedSlip && (
              <div className="space-y-4 text-xs">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
                    <div>
                      <h3 className="font-black text-slate-900 text-sm">PT. KALOPSIA AUREON PHARMA</h3>
                      <p className="text-[11px] text-slate-500">SLIP GAJI RESMI • PERIODE SEPTEMBER 2026</p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-800">{selectedSlip.empId}</div>
                      <div className="text-[11px] text-emerald-700 font-semibold">STATUS: LUNAS TRANSFER</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Nama Karyawan:</span>
                      <strong className="text-slate-900">{selectedSlip.empName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Jabatan & Divisi:</span>
                      <strong className="text-slate-900">{selectedSlip.role} ({selectedSlip.department})</strong>
                    </div>
                  </div>

                  {/* RINCIAN PENDAPATAN & POTONGAN */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3">
                    {/* PENERIMAAN */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px] uppercase">
                        A. Penerimaan (Earnings & Upah Tetap)
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Gaji Pokok:</span>
                        <span className="font-mono font-bold text-slate-800">{formatRupiah(selectedSlip.basicSalary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Tunjangan Jabatan:</span>
                        <span className="font-mono text-slate-800">{formatRupiah(selectedSlip.allowance)}</span>
                      </div>
                      <div className="flex justify-between bg-slate-100/70 px-1 py-0.5 rounded text-[10px] text-slate-700 font-semibold">
                        <span>Upah Tetap (Pokok + Jabatan):</span>
                        <span className="font-mono">{formatRupiah(selectedSlip.basicSalary + selectedSlip.allowance)}</span>
                      </div>
                      {selectedSlip.transportFlat !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Transport (Flat):</span>
                          <span className="font-mono text-slate-800">{formatRupiah(selectedSlip.transportFlat)}</span>
                        </div>
                      )}
                      {selectedSlip.transportTentative !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Transport (Tentatif/Kehadiran):</span>
                          <span className="font-mono text-slate-800">{formatRupiah(selectedSlip.transportTentative)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">Upah Lembur SPL:</span>
                        <span className="font-mono text-emerald-700 font-bold">{formatRupiah(selectedSlip.overtimePay)}</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                        <span>Total Kotor:</span>
                        <span className="font-mono">{formatRupiah(selectedSlip.basicSalary + selectedSlip.allowance + (selectedSlip.transportFlat || 0) + (selectedSlip.transportTentative || 0) + selectedSlip.overtimePay)}</span>
                      </div>
                    </div>

                    {/* POTONGAN */}
                    <div className="space-y-1.5">
                      <div className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px] uppercase">
                        B. Potongan (Deductions & Kasbon)
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">BPJS Kesehatan (1%):</span>
                        <span className="font-mono text-rose-600">-{formatRupiah(selectedSlip.bpjsHealth || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">BPJS Ketenagakerjaan (2%):</span>
                        <span className="font-mono text-rose-600">-{formatRupiah(selectedSlip.bpjsEmployment || 0)}</span>
                      </div>
                      {selectedSlip.loanDeduction !== undefined && selectedSlip.loanDeduction > 0 && (
                        <div className="bg-amber-50/80 p-1.5 rounded border border-amber-200/60 space-y-0.5">
                          <div className="flex justify-between font-semibold text-amber-900">
                            <span>Potongan Kasbon (Pinjaman):</span>
                            <span className="font-mono text-rose-700">-{formatRupiah(selectedSlip.loanDeduction)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-amber-700">
                            <span>Sisa Pinjaman Berjalan:</span>
                            <span className="font-mono font-bold">{formatRupiah(selectedSlip.remainingLoan || 0)}</span>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-600">PPh 21 (Di atas UMR):</span>
                        <span className="font-mono text-rose-600">-{formatRupiah(selectedSlip.taxPph21)}</span>
                      </div>
                      {selectedSlip.lateDeduction > 0 && (
                        <div className="flex justify-between">
                          <span className="text-slate-600">Potongan Terlambat:</span>
                          <span className="font-mono text-rose-600">-{formatRupiah(selectedSlip.lateDeduction)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-rose-700">
                        <span>Total Potongan:</span>
                        <span className="font-mono">-{formatRupiah((selectedSlip.bpjsHealth || 0) + (selectedSlip.bpjsEmployment || 0) + (selectedSlip.loanDeduction || 0) + selectedSlip.taxPph21 + selectedSlip.lateDeduction)}</span>
                      </div>
                    </div>
                  </div>

                  {/* NET TAKE HOME PAY */}
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-emerald-800 text-[11px] block">GAJI BERSIH (TAKE HOME PAY):</span>
                      <span className="font-mono font-black text-emerald-900 text-base">{formatRupiah(selectedSlip.netSalary)}</span>
                    </div>
                    <div className="text-right text-slate-600">
                      <div className="text-[11px]">Ditransfer ke:</div>
                      <div className="font-mono font-bold text-slate-900">{selectedSlip.bankName} - {selectedSlip.bankAccount}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex gap-2">
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Slip PDF
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Slip gaji terkirim via WhatsApp resmi!")}>
              <Send className="w-4 h-4 mr-1.5" />
              Kirim WA Pegawai
            </DnaButton>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
