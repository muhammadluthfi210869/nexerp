import React from "react";
import { Send } from "lucide-react";
import { DnaModal, DnaButton } from "@/components/dna";
import {
  ActivePoOption,
  CASH_BANK_ACCOUNTS,
} from "../_types/dp-pembelian.types";

interface DpFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  activePos: ActivePoOption[];
  selectedPoNumber: string;
  onSelectPo: (poNo: string) => void;
  dpDate: string;
  setDpDate: (date: string) => void;
  dpPercentage: number;
  onPercentageChange: (pct: number) => void;
  dpAmount: number;
  setDpAmount: (amount: number) => void;
  paymentAccount: string;
  setPaymentAccount: (acc: string) => void;
  referenceNumber: string;
  setReferenceNumber: (ref: string) => void;
  formNotes: string;
  setFormNotes: (notes: string) => void;
}

export function DpFormModal({
  isOpen,
  onClose,
  onSubmit,
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
  referenceNumber,
  setReferenceNumber,
  formNotes,
  setFormNotes,
}: DpFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Pembayaran Uang Muka (DP Pembelian)"
      description="Pilih Purchase Order yang disepakati memiliki termin uang muka sebelum pengiriman barang."
      size="2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<Send className="w-4 h-4" />}
            onClick={onSubmit}
          >
            Konfirmasi & Bayar DP
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-800 font-bold mb-1">
              Pilih Dokumen PO Referensi *
            </label>
            <select
              aria-label="Pilih PO"
              value={selectedPoNumber}
              onChange={(e) => onSelectPo(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-medium"
            >
              <option value="">-- Pilih Purchase Order --</option>
              {activePos.map((p) => (
                <option key={p.poNumber} value={p.poNumber}>
                  {p.poNumber} - {p.vendorName} (Rp{" "}
                  {p.totalAmount.toLocaleString("id-ID")})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-800 font-bold mb-1">
              Tanggal Pembayaran DP *
            </label>
            <input
              type="date"
              value={dpDate}
              onChange={(e) => setDpDate(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 tabular-nums"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 items-end">
          <div>
            <label className="block text-zinc-800 font-bold mb-1">
              Persentase DP (%)
            </label>
            <div className="flex items-center gap-1.5">
              {[20, 30, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => onPercentageChange(pct)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dpPercentage === pct
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-zinc-800 font-bold mb-1">
              Nominal Uang Muka (Rp) *
            </label>
            <input
              type="number"
              min="0"
              value={dpAmount}
              onChange={(e) => setDpAmount(parseFloat(e.target.value) || 0)}
              className="w-full text-sm font-black tabular-nums text-zinc-900 border border-zinc-200 rounded-xl p-2.5 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-800 font-bold mb-1">
              Akun Kas / Bank Pengeluaran *
            </label>
            <select
              aria-label="Akun Kas Bank"
              value={paymentAccount}
              onChange={(e) => setPaymentAccount(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-medium"
            >
              {CASH_BANK_ACCOUNTS.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-800 font-bold mb-1">
              No. Referensi Transfer / Giro
            </label>
            <input
              type="text"
              placeholder="Contoh: TRF-BCA-9812401"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 tabular-nums"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-800 font-bold mb-1">
            Catatan Tambahan
          </label>
          <textarea
            rows={2}
            placeholder="Contoh: Uang muka pelunasan cetak kemasan botol batch 1."
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            className="w-full text-xs border border-zinc-200 rounded-xl p-2.5 bg-zinc-50 focus:bg-white text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
          />
        </div>
      </div>
    </DnaModal>
  );
}
