"use client";

import React from "react";
import {
  ArrowUpRight,
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
import type { CashOutFormData } from "../_types/cash-out.types";

interface CashOutCreateCanvasProps {
  onClose: () => void;
  formData: CashOutFormData;
  setFormData: React.Dispatch<React.SetStateAction<CashOutFormData>>;
  onSave: () => void;
}

export function CashOutCreateCanvas({
  onClose,
  formData,
  setFormData,
  onSave,
}: CashOutCreateCanvasProps) {
  const numericAmount = Number(formData.amount) || 0;

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-rose-50 text-rose-600">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Buat Pengeluaran Kas & Bank Keluar (Payment Voucher)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              🏷️ Auto-Number: BKK-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan pengeluaran kas/bank, pembayaran utilitas, biaya operasional, dan reimbursement dengan auto-jurnal buku besar.
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
        {/* Left Column: Rekening Sumber & Penerima */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Wallet className="w-4 h-4 text-rose-600" />
              1. Rekening Sumber & Penerima Pembayaran
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Pengeluaran *
              </label>
              <DnaInput
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rekening Kas / Bank Sumber *
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
              Kepada (Nama Penerima / Vendor / Karyawan) *
            </label>
            <DnaInput
              placeholder="Contoh: PT Chemika Prima Nusa / Bpk. Sutrisno"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
            />
          </div>
        </DnaCard>

        {/* Right Column: Akun CoA Beban & Nominal */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Receipt className="w-4 h-4 text-indigo-600" />
              2. Klasifikasi Beban CoA & Nominal
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chart of Account (CoA) Beban / Pengeluaran *
            </label>
            <DnaSelect
              value={formData.coaExpense}
              onChange={(value) => setFormData({ ...formData, coaExpense: value })}
              options={[
                { label: "5110 - Biaya Pengadaan Bahan Baku & Packaging", value: "5110 - Biaya Bahan Baku & Kemas" },
                { label: "5210 - Biaya Gaji, Upah & Lembur Karyawan", value: "5210 - Biaya Gaji & Upah" },
                { label: "5220 - Biaya Utilitas Listrik & Air Pabrik", value: "5220 - Biaya Listrik & Air Pabrik" },
                { label: "5230 - Biaya Pengiriman & Logistik Ekspedisi", value: "5230 - Biaya Ekspedisi & Logistik" },
                { label: "5240 - Biaya Notifikasi BPOM & Uji Lab", value: "5240 - Biaya Notifikasi BPOM & Uji Lab" },
                { label: "5290 - Biaya Operasional Kantor & Petty Cash", value: "5290 - Biaya Operasional Kantor" },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jumlah Pengeluaran (Rp) *
              </label>
              <DnaInput
                type="number"
                min="1"
                placeholder="Contoh: 8500000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                No. Tagihan / Catatan Pendukung
              </label>
              <DnaInput
                placeholder="Contoh: Pembayaran via transfer Mandiri"
                value={formData.entryNotes}
                onChange={(e) => setFormData({ ...formData, entryNotes: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Deskripsi / Keterangan Pengeluaran *
            </label>
            <DnaInput
              placeholder="Contoh: Pembayaran tagihan listrik pabrik & utilitas September"
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
                <span className="text-slate-500 block text-[11px]">Debit (Beban/Pengeluaran)</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formData.coaExpense}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Kredit (Pengurangan Kas/Bank)</span>
                <span className="font-bold text-slate-900 text-sm">
                  [{formData.account?.split(" ")[0] || "1120"}] {formData.account}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Pengeluaran</span>
                <span className="font-extrabold text-rose-600 text-lg tabular-nums">
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
              Posting Pengeluaran
            </DnaButton>
          </div>
        </div>
      </DnaCard>
    </div>
  );
}
