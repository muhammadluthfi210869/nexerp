"use client";

import React, { useState } from "react";
import {
  DnaButton,
  DnaInput,
} from "@/components/dna";
import { X, CreditCard, AlertCircle } from "lucide-react";
import { EmployeeItem } from "../_types/employee.types";

interface EmployeeLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    employeeId: string;
    totalAmount: number;
    monthlyDeduction: number;
    reason?: string;
  }) => void;
  isSubmitting: boolean;
  employee: EmployeeItem | null;
}

export function EmployeeLoanModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  employee,
}: EmployeeLoanModalProps) {
  const [totalAmount, setTotalAmount] = useState("2000000");
  const [monthlyDeduction, setMonthlyDeduction] = useState("500000");
  const [reason, setReason] = useState("");

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(totalAmount) || 0;
    const monthly = parseFloat(monthlyDeduction) || 0;
    if (total <= 0 || monthly <= 0) return;

    onSubmit({
      employeeId: employee.id,
      totalAmount: total,
      monthlyDeduction: monthly,
      reason,
    });
  };

  const installments =
    parseFloat(totalAmount) > 0 && parseFloat(monthlyDeduction) > 0
      ? Math.ceil(parseFloat(totalAmount) / parseFloat(monthlyDeduction))
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Pencatatan Kasbon / Pinjaman</h3>
              <p className="text-[11px] text-slate-500 font-medium">Pegawai: {employee.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Total Pinjaman (Rp) *</label>
            <DnaInput
              type="number"
              required
              min={100000}
              step={50000}
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Potongan Per Bulan (Rp) *</label>
            <DnaInput
              type="number"
              required
              min={50000}
              step={50000}
              value={monthlyDeduction}
              onChange={(e) => setMonthlyDeduction(e.target.value)}
            />
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center gap-2.5 text-xs text-purple-900">
            <AlertCircle className="w-4 h-4 text-purple-600 shrink-0" />
            <span>
              Perkiraan masa angsuran: <strong>{installments} kali potong gaji</strong> (Payroll bulanan).
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Keperluan / Keterangan</label>
            <DnaInput
              placeholder="Contoh: Kebutuhan darurat keluarga"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={onClose}>
              Batal
            </DnaButton>
            <DnaButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Catat Pinjaman"}
            </DnaButton>
          </div>
        </form>
      </div>
    </div>
  );
}
