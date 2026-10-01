"use client";

import React from "react";
import {
  ArrowLeft,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  Save,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Info,
} from "lucide-react";
import { DnaButton, DnaBadge, formatRupiah } from "@/components/dna";
import type { DpCategory } from "../_types/down-payment.types";

interface DpCreateCanvasProps {
  onBack: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  isSubmitting: boolean;
  formCategory: DpCategory;
  setFormCategory: (cat: DpCategory) => void;
  selectedSoId: string;
  onSelectSo: (soId: string) => void;
  salesOrders: any[];
  formDate: string;
  setFormDate: (val: string) => void;
  formCustomer: string;
  setFormCustomer: (val: string) => void;
  formBrand: string;
  setFormBrand: (val: string) => void;
  formRef: string;
  setFormRef: (val: string) => void;
  formBank: string;
  setFormBank: (val: string) => void;
  formAmount: string;
  setFormAmount: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
  applySampleFeeOffset: boolean;
  setApplySampleFeeOffset: (val: boolean) => void;
  autoGenerateRef: (cat: DpCategory) => string;
}

export function DpCreateCanvas({
  onBack,
  onSubmit,
  isSubmitting,
  formCategory,
  setFormCategory,
  selectedSoId,
  onSelectSo,
  salesOrders,
  formDate,
  setFormDate,
  formCustomer,
  setFormCustomer,
  formBrand,
  setFormBrand,
  formRef,
  setFormRef,
  formBank,
  setFormBank,
  formAmount,
  setFormAmount,
  formNotes,
  setFormNotes,
  applySampleFeeOffset,
  setApplySampleFeeOffset,
  autoGenerateRef,
}: DpCreateCanvasProps) {
  const selectedSo = salesOrders.find((s) => s.id === selectedSoId);
  const soTotal = selectedSo ? Number(selectedSo.totalAmount) || 0 : 0;
  const numAmount = Number(formAmount) || 0;
  const dpPct = soTotal > 0 ? Math.round((numAmount / soTotal) * 100) : null;

  return (
    <div className="space-y-6">
      {/* HEADER SECTION WITH AUTO-NUMBER BADGE & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Pencatatan Uang Muka Penjualan (Down Payment)
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                🏷️ Auto-Number: DPJ-AUTO
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Input penerimaan DP Sample R&D, Legalitas BPOM, atau DP PO Produksi dengan auto-populasi data klien.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <DnaButton variant="secondary" size="md" onClick={onBack}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={() => onSubmit()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Uang Muka"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: REFERENSI DOKUMEN & PEMESAN */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-900" />
              <span>1. Referensi Dokumen & Kategori DP</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Kategori Selector */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1.5">
                Kategori Uang Muka <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "sample", label: "1. DP Sample R&D" },
                  { id: "legalitas", label: "2. DP Legalitas BPOM" },
                  { id: "produksi", label: "3. DP PO Produksi" },
                ].map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setFormCategory(cat.id as DpCategory);
                      if (cat.id !== "produksi" && !formRef.startsWith(cat.id === "sample" ? "SMP" : "BPOM")) {
                        autoGenerateRef(cat.id as DpCategory);
                      }
                    }}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all ${
                      formCategory === cat.id
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Source SO Dropdown when Produksi */}
            {formCategory === "produksi" && (
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-zinc-800 font-bold">
                    Pilih No. Sales Order (SO) Sumber <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] font-bold text-zinc-700 bg-zinc-200/80 px-2 py-0.5 rounded">
                    Auto-Fill Aktif
                  </span>
                </div>
                <select
                  value={selectedSoId}
                  onChange={(e) => onSelectSo(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-semibold text-zinc-900"
                >
                  <option value="">— Pilih Sales Order yang Menunggu DP —</option>
                  {salesOrders.map((so: any) => (
                    <option key={so.id} value={so.id}>
                      {so.orderNumber} • {so.lead?.clientName || so.customerName} ({so.brandName || "Brand"}) — Rp {Number(so.totalAmount || 0).toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>
                {selectedSo && (
                  <div className="text-[11px] text-zinc-800 flex items-center justify-between pt-1">
                    <span>Total Nilai SO: <strong>Rp {soTotal.toLocaleString("id-ID")}</strong></span>
                    <span>Rekomendasi DP 50%: <strong>Rp {Math.round(soTotal * 0.5).toLocaleString("id-ID")}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Client & Brand Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama Klien / Perusahaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formCustomer}
                  onChange={(e) => setFormCustomer(e.target.value)}
                  placeholder="PT Cantika Jelita Nusantara"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nama Brand Produk
                </label>
                <input
                  type="text"
                  value={formBrand}
                  onChange={(e) => setFormBrand(e.target.value)}
                  placeholder="C-Jelita Glowing Series"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-700 font-bold">
                  Nomor Referensi Dokumen {formCategory === "produksi" ? "(No. SO)" : "(Auto)"}
                </label>
                <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {formCategory === "produksi" ? "Terkait Sales Order" : "Terkait Formulir / PO"}
                </span>
              </div>
              <input
                type="text"
                value={formRef}
                onChange={(e) => setFormRef(e.target.value)}
                placeholder="Contoh: SO-202609-0001 atau SMP-202609-1234"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: PARAMETER FINANSIAL & REKENING BANK */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-900" />
              <span>2. Parameter Finansial & Rekening Kas/Bank</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Tanggal & Rekening */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Tanggal Penerimaan DP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-semibold bg-white"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Akun Kas / Bank Penerima <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formBank}
                  onChange={(e) => setFormBank(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 bg-white font-medium text-zinc-800"
                >
                  <option value="BCA Maklon (264-035-1589)">BCA Maklon (264-035-1589)</option>
                  <option value="Mandiri Corp (137-00-9821-44)">Mandiri Corp (137-00-9821-44)</option>
                  <option value="Kas Utama Kantor">Kas Utama Kantor</option>
                </select>
              </div>
            </div>

            {/* Nominal DP */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-700 font-bold">
                  Nominal Uang Muka (Rp) <span className="text-rose-500">*</span>
                </label>
                {selectedSo && soTotal > 0 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormAmount(String(Math.round(soTotal * 0.5)))}
                      className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-200"
                    >
                      ⚡ 50% SO (Rp {Math.round(soTotal * 0.5).toLocaleString("id-ID")})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormAmount(String(soTotal))}
                      className="text-[10px] font-bold text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 hover:bg-zinc-200"
                    >
                      100% Lunas
                    </button>
                  </div>
                )}
              </div>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Contoh: 25000000"
                className="w-full px-3 py-2 text-sm rounded-xl border border-zinc-200 bg-white font-bold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                required
              />
              {numAmount > 0 && (
                <div className="text-[11px] text-zinc-500 font-medium mt-1 flex items-center justify-between">
                  <span>Terbilang: <strong className="text-zinc-800">{formatRupiah(numAmount)}</strong></span>
                  {dpPct !== null && (
                    <span className={`font-bold ${dpPct >= 50 ? "text-emerald-700" : "text-amber-700"}`}>
                      {dpPct}% dari Nilai SO {dpPct < 50 && "(Min. 50% untuk produksi)"}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Offset Sample Fee Toggle for Produksi */}
            {formCategory === "produksi" && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                <div className="space-y-0.5">
                  <div className="font-bold text-zinc-800 text-xs">Kompensasi Sample Fee R&D</div>
                  <div className="text-[11px] text-zinc-500">
                    Otomatis kurangi tagihan DP produksi dengan biaya sample R&D yang sudah dibayar klien.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={applySampleFeeOffset}
                  onChange={(e) => setApplySampleFeeOffset(e.target.checked)}
                  className="w-4 h-4 rounded text-zinc-900 focus:ring-zinc-900"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Catatan Penerimaan & Keterangan Bank
              </label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Contoh: Pembayaran DP 50% via transfer BCA. Bukti transfer telah divalidasi bagian finance."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            {/* Live Financial Summary Box */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Kategori Uang Muka:</span>
                <span className="font-bold text-zinc-900 uppercase">{formCategory}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Target Dokumen:</span>
                <span className="font-mono font-bold text-zinc-800">{formRef || "-"}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 pt-2">
                <span className="font-bold text-zinc-800">Total Nominal DP Dicatat:</span>
                <span className="font-extrabold text-zinc-900 text-sm tabular-nums font-mono">
                  {formatRupiah(numAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
