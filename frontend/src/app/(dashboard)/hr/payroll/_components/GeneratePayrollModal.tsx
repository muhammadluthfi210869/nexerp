"use client";

import React, { useState } from "react";
import { DnaButton, DnaInput, DnaSelect } from "@/components/dna";
import { X, Wallet, AlertCircle } from "lucide-react";

interface GeneratePayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (period: string) => void;
  isSubmitting: boolean;
}

export function GeneratePayrollModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: GeneratePayrollModalProps) {
  const currentMonth = new Date().toLocaleString("id-ID", { month: "long", year: "numeric" });
  const [period, setPeriod] = useState(currentMonth);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!period.trim()) return;
    onSubmit(period.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Generate Payroll Bulanan</h3>
              <p className="text-[11px] text-slate-500 font-medium">Kalkulasi upah, kehadiran, lembur & PPh 21</p>
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
            <label className="text-xs font-bold text-slate-700">Nama Periode Finansial *</label>
            <DnaInput
              required
              placeholder="Contoh: Oktober 2026 atau 2026-10"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Aturan & Validasi Otomatis (BUS-RULE-073)
            </div>
            <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 ml-1">
              <li>Lembur harus sudah disetujui supervisor sebelum generate</li>
              <li>PPh 21 otomatis memotong 5% untuk penghasilan di atas batas UMR (Rp 5.000.000)</li>
              <li>Kasbon otomatis dipotong dari gaji dan sisa saldo diperbarui</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <DnaButton type="button" variant="secondary" onClick={onClose}>
              Batal
            </DnaButton>
            <DnaButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Mengalkulasi..." : "Proses Generate"}
            </DnaButton>
          </div>
        </form>
      </div>
    </div>
  );
}
