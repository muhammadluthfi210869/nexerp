"use client";

import React from "react";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Send,
  DollarSign,
  Receipt,
  FileText,
} from "lucide-react";
import { DnaButton, formatRupiah } from "@/components/dna";

interface DpPembelianCanvasProps {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  activePos: any[];
  selectedPoNumber: string;
  onSelectPo: (poNumber: string) => void;
  dpDate: string;
  setDpDate: (date: string) => void;
  dpPercentage: number;
  onPercentageChange: (pct: number) => void;
  dpAmount: number;
  setDpAmount: (amt: number) => void;
  paymentAccount: string;
  setPaymentAccount: (acc: string) => void;
  cashBankAccounts: string[];
  referenceNumber: string;
  setReferenceNumber: (ref: string) => void;
  formNotes: string;
  setFormNotes: (notes: string) => void;
}

export function DpPembelianCanvas({
  onBack,
  onSubmit,
  isSubmitting,
  activePos,
  selectedPoNumber,
  onSelectPo,
  dpDate,
  setDpDate,
  dpPercentage,
  onPercentageChange,
  dpAmount,
  setDpAmount,
  paymentAccount,
  setPaymentAccount,
  cashBankAccounts,
  referenceNumber,
  setReferenceNumber,
  formNotes,
  setFormNotes,
}: DpPembelianCanvasProps) {
  const selectedPo = activePos.find((p) => p.poNumber === selectedPoNumber);

  return (
    <div className="space-y-6">
      {/* TOP HEADER WITH ACTIONS & AUTO-NUMBER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-black text-zinc-900 tracking-tight">
                Pencatatan Uang Muka Pembelian (DP Supplier)
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-zinc-100 text-zinc-800 border border-zinc-200">
                Auto-Number: DPB-AUTO
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Pencatatan dan pencairan termin uang muka PO kepada supplier rekanan dengan auto-pull data order.
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
            icon={<Send className="w-4 h-4" />}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Memproses..." : "Konfirmasi & Bayar DP"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: DOKUMEN PO & SUPPLIER */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-zinc-900" />
              <span>1. Dokumen Purchase Order & Supplier</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-zinc-800 font-bold mb-1.5">
                Pilih Dokumen PO Referensi <span className="text-rose-500">*</span>
              </label>
              <select
                aria-label="Pilih PO"
                value={selectedPoNumber}
                onChange={(e) => onSelectPo(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-semibold text-zinc-900"
              >
                <option value="">— Pilih Purchase Order yang Membutuhkan DP —</option>
                {activePos.map((p) => (
                  <option key={p.poNumber} value={p.poNumber}>
                    {p.poNumber} • {p.vendorName} — Total: Rp {Number(p.totalAmount || 0).toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
            </div>

            {selectedPo && (
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2.5">
                <div className="font-bold text-zinc-800 text-xs flex items-center justify-between">
                  <span>Rincian Purchase Order</span>
                  <span className="text-zinc-900 font-mono text-[11px] font-bold">{selectedPo.poNumber}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1">
                  <div>
                    <span className="text-zinc-500 block">Nama Supplier:</span>
                    <strong className="text-zinc-900">{selectedPo.vendorName}</strong>
                  </div>
                  <div>
                    <span className="text-zinc-500 block">Kode Vendor:</span>
                    <strong className="text-zinc-900 font-mono">{selectedPo.vendorCode}</strong>
                  </div>
                  <div className="col-span-2 border-t border-zinc-200 pt-2 flex items-center justify-between">
                    <span className="text-zinc-500">Total Nilai Purchase Order:</span>
                    <span className="font-black text-zinc-900 text-sm tabular-nums">
                      Rp {Number(selectedPo.totalAmount || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: PARAMETER FINANSIAL & KAS KELUAR */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-zinc-900" />
              <span>2. Parameter Finansial & Kas Keluar</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 font-bold mb-1">
                  Tanggal Pembayaran DP <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={dpDate}
                  onChange={(e) => setDpDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white font-semibold text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-zinc-800 font-bold mb-1">
                  Akun Kas / Bank Pengeluaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentAccount}
                  onChange={(e) => setPaymentAccount(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white font-medium text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                >
                  {cashBankAccounts.map((acc) => (
                    <option key={acc} value={acc}>
                      {acc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Persentase & Nominal DP */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-zinc-800 font-bold">
                  Nominal Uang Muka (Rp) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  {[20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => onPercentageChange(pct)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                        dpPercentage === pct
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-2xs"
                          : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={dpAmount}
                onChange={(e) => setDpAmount(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2.5 text-sm font-black text-zinc-900 border border-zinc-200 rounded-xl bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-800 font-bold mb-1">
                  Nomor Referensi Bukti Transfer
                </label>
                <input
                  type="text"
                  placeholder="TRX-BCA-109281"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-zinc-800 font-bold mb-1">
                  Catatan Pembayaran
                </label>
                <input
                  type="text"
                  placeholder="Pembayaran DP PO"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-zinc-200 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>

            {/* Live Summary Box */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Nominal DP Terbayar:</span>
                <span className="font-black text-zinc-900 text-sm tabular-nums">
                  {formatRupiah(dpAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
