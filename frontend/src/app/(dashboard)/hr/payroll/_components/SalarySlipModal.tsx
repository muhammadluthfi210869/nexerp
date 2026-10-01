"use client";

import React from "react";
import { DnaButton } from "@/components/dna";
import { X, Printer, ShieldCheck } from "lucide-react";
import { PayrollItemRecord, PayrollRecord } from "../_types/payroll.types";

interface SalarySlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayrollItemRecord | null;
  activePayroll: PayrollRecord | null;
}

export function SalarySlipModal({
  isOpen,
  onClose,
  item,
  activePayroll,
}: SalarySlipModalProps) {
  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  const fixedWages = item.baseSalary + item.positionAllowance;
  const allowancesTotal = item.transportFlat + item.transportTentative + item.overtimePay + item.kpiIncentive;
  const bpjsTotal = item.bpjsHealth + item.bpjsEmployment;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/75 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Preview Slip Gaji Karyawan Resmi</span>
          </div>
          <div className="flex items-center gap-2">
            <DnaButton size="sm" onClick={handlePrint} className="flex items-center gap-1.5 font-bold">
              <Printer className="w-3.5 h-3.5" />
              Cetak Slip Gaji
            </DnaButton>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Slip Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-900 font-sans print:p-0 print:m-0" id="salary-slip-document">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
                  PT AUREON KOSMETINDO NUSANTARA
                </h1>
                <p className="text-[10px] text-slate-600 font-semibold tracking-wide">
                  NEX ERP INDUSTRIAL SYSTEM • SLIP GAJI KARYAWAN RESMI
                </p>
                <p className="text-[10px] text-slate-500">
                  Kawasan Industri Manufaktur Kosmetik & Farmasi
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 text-[10px] font-mono font-bold rounded border border-slate-300">
                  SLIP-{item.id.slice(0, 8).toUpperCase()}
                </span>
                <p className="text-xs font-bold text-slate-900 mt-1">
                  Periode: {activePayroll?.periodName || "Berjalan"}
                </p>
              </div>
            </div>
          </div>

          {/* Employee Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-slate-400 text-[10px] font-bold uppercase">Nama Pegawai</div>
              <div className="text-slate-900 font-black text-sm mt-0.5">{item.employeeName}</div>
              <div className="text-slate-600 mt-1">ID Karyawan: {item.employeeId.slice(0, 8)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-bold uppercase">Jabatan & Departemen</div>
              <div className="text-slate-900 font-bold text-sm mt-0.5">{item.employeePosition}</div>
              <div className="text-slate-600 mt-1">Divisi: {item.department}</div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6 text-xs">
            {/* Column 1: Penerimaan (Earnings) */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 text-emerald-700">
                A. Rincian Penerimaan (Income)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Gaji Pokok:</span>
                  <span className="font-bold text-slate-900">Rp {item.baseSalary.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Tunjangan Jabatan:</span>
                  <span className="font-bold text-slate-900">Rp {item.positionAllowance.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Transport Flat:</span>
                  <span className="font-bold text-slate-900">Rp {item.transportFlat.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Transport Tentatif Kehadiran:</span>
                  <span className="font-bold text-slate-900">Rp {item.transportTentative.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Upah Lembur Disetujui (Overtime):</span>
                  <span className="font-bold text-slate-900">Rp {item.overtimePay.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Insentif Performa KPI:</span>
                  <span className="font-bold text-slate-900">Rp {item.kpiIncentive.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900">
                  <span>Total Penghasilan Kotor (Gross):</span>
                  <span className="text-emerald-700">Rp {item.grossIncome.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            {/* Column 2: Potongan (Deductions) */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="font-bold text-[11px] text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 text-rose-700">
                B. Rincian Potongan (Deductions)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">BPJS Kesehatan (1%):</span>
                  <span className="font-bold text-slate-900">Rp {item.bpjsHealth.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">BPJS Ketenagakerjaan (2%):</span>
                  <span className="font-bold text-slate-900">Rp {item.bpjsEmployment.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Potongan Pinjaman (Kasbon):</span>
                  <span className="font-bold text-slate-900">Rp {item.loanDeduction.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Pajak PPh 21 (Threshold UMR):</span>
                  <span className="font-bold text-slate-900">
                    {item.pph21 > 0 ? `Rp ${item.pph21.toLocaleString("id-ID")}` : "Rp 0 (Nihil)"}
                  </span>
                </div>
                {typeof item.remainingLoan === "number" && item.remainingLoan > 0 && (
                  <div className="p-2 bg-amber-50 rounded text-[10px] text-amber-800">
                    Sisa Kasbon Setelah Periode Ini: Rp {item.remainingLoan.toLocaleString("id-ID")}
                  </div>
                )}
                <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-slate-900">
                  <span>Total Potongan:</span>
                  <span className="text-rose-700">Rp {item.totalDeductions.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Take Home Pay Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-5 mb-8 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                TOTAL GAJI DITERIMA (TAKE HOME PAY)
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Ditransfer ke rekening terdaftar karyawan
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400">
                Rp {item.netSalary.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-4 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-16">Disiapkan oleh HR & Finance,</p>
              <div className="w-40 border-b border-slate-400 mx-auto" />
              <p className="font-bold text-slate-900 mt-1">HR & GA Division</p>
            </div>
            <div>
              <p className="text-slate-500 mb-16">Diterima oleh Pegawai,</p>
              <div className="w-40 border-b border-slate-400 mx-auto" />
              <p className="font-bold text-slate-900 mt-1">{item.employeeName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
