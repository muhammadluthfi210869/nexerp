"use client";

import React from "react";
import {
  ArrowDownLeft,
  Building2,
  Calendar,
  Wallet,
  CheckCircle2,
  Receipt,
  Layers,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  formatRupiah,
} from "@/components/dna";
import type { CashInFormData } from "../_types/cash-in.types";

interface CashInCreateCanvasProps {
  onClose: () => void;
  formData: CashInFormData;
  setFormData: React.Dispatch<React.SetStateAction<CashInFormData>>;
  onSave: () => void;
}

export function CashInCreateCanvas({
  onClose,
  formData,
  setFormData,
  onSave,
}: CashInCreateCanvasProps) {
  const numericAmount = Number(formData.amount) || 0;

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Buat Penerimaan Kas & Bank Masuk (Deposit Voucher)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🏷️ Auto-Number: BKM-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan mutasi penerimaan kas/bank, pendapatan jasa maklon/BPOM, dan setoran dengan pembukuan jurnal otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={onSave}
            disabled={numericAmount <= 0 || !formData.account || !formData.description}
          >
            Simpan & Posting Jurnal
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Rekening & Tanggal */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Wallet className="w-4 h-4 text-emerald-600" />
              1. Rekening Penerima & Penyetor
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Penerimaan *
              </label>
              <DnaInput
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rekening Kas / Bank Penerima *
              </label>
              <DnaSelect
                value={formData.account}
                onChange={(value) => setFormData({ ...formData, account: value })}
                options={[
                  { label: "1120 - Bank BCA Operasional (521-009182)", value: "BCA Operasional (521-009182)" },
                  { label: "1130 - Bank Mandiri Payroll & Pajak (137-00123)", value: "Mandiri Payroll (137-00123)" },
                  { label: "1110 - Kas Tunai Petty Cash Kantor", value: "Kas Tunai Operasional" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dari (Nama Penyetor / Klien) *
            </label>
            <DnaInput
              placeholder="Contoh: PT Glowing Beauty Indonesia / Bpk. Hendra"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
            />
          </div>
        </DnaCard>

        {/* Right Column: Akun CoA & Nominal */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Receipt className="w-4 h-4 text-indigo-600" />
              2. Klasifikasi Pendapatan & Nominal
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chart of Account (CoA) Pendapatan *
            </label>
            <DnaSelect
              value={formData.coaRevenue}
              onChange={(value) => setFormData({ ...formData, coaRevenue: value })}
              options={[
                { label: "4110 - Pendapatan Produksi Maklon OEM", value: "4110 - Pendapatan Produksi Maklon" },
                { label: "4120 - Pendapatan Sample & Prototipe R&D", value: "4120 - Pendapatan Sample R&D" },
                { label: "4130 - Jasa Notifikasi BPOM & HKI", value: "4130 - Jasa Notifikasi BPOM" },
                { label: "4190 - Pendapatan Bunga & Lainnya", value: "4190 - Pendapatan Bunga & Lainnya" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Nominal (Rp) *
              </label>
              <DnaInput
                type="number"
                min="1"
                placeholder="Contoh: 15000000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Memo / Catatan Pendukung
              </label>
              <DnaInput
                placeholder="Contoh: Lampiran slip transfer ATM"
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi / Keterangan Penerimaan *
            </label>
            <DnaInput
              placeholder="Contoh: Penerimaan pelunasan termin 2 produksi serum"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </DnaCard>
      </div>

      {/* Bottom Summary: Auto-Journal Preview */}
      <DnaCard className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Jurnal Otomatis yang Terbentuk (Double-Entry Posting)
            </span>
            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Debit (Penerimaan Kas/Bank)</span>
                <span className="font-bold text-slate-900 text-sm">
                  [{formData.account?.split(" ")[0] || "1120"}] {formData.account}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Kredit (Pendapatan/Hutang)</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formData.coaRevenue}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Penerimaan</span>
                <span className="font-extrabold text-emerald-700 text-lg tabular-nums">
                  {formatRupiah(numericAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0">
            <DnaButton
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={onSave}
              disabled={numericAmount <= 0 || !formData.account || !formData.description}
            >
              Posting Penerimaan
            </DnaButton>
          </div>
        </div>
      </DnaCard>
    </div>
  );
}
