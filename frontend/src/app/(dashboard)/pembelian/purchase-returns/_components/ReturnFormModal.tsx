import React from "react";
import { Send, Trash2 } from "lucide-react";
import { DnaModal, DnaButton } from "@/components/dna";
import type {
  AvailableInbound,
  CompensationType,
  ReturnItem,
} from "../_types/purchase-returns.types";

interface ReturnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableInbounds: AvailableInbound[];
  selectedGrnId: string;
  onSelectGrn: (grnId: string) => void;
  returnDate: string;
  setReturnDate: (date: string) => void;
  compensationType: CompensationType;
  setCompensationType: (type: CompensationType) => void;
  items: ReturnItem[];
  onUpdateItem: (index: number, field: keyof ReturnItem, value: any) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  formTotalAmount: number;
  formNotes: string;
  setFormNotes: (notes: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function ReturnFormModal({
  isOpen,
  onClose,
  availableInbounds,
  selectedGrnId,
  onSelectGrn,
  returnDate,
  setReturnDate,
  compensationType,
  setCompensationType,
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  formTotalAmount,
  formNotes,
  setFormNotes,
  onSubmit,
  isSubmitting,
}: ReturnFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Pengajuan Retur Pembelian (Debit Note)"
      description="Pilih dokumen penerimaan barang (GRN) yang memiliki material reject/cacat untuk dikembalikan ke supplier."
      size="2xl"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            loading={isSubmitting}
            icon={<Send className="w-4 h-4" />}
            onClick={onSubmit}
          >
            Kirim Pengajuan Retur
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Pilih Dokumen GRN Asal *</label>
            <select
              aria-label="Pilih GRN"
              value={selectedGrnId}
              onChange={(e) => onSelectGrn(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2 bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 font-medium text-zinc-900"
            >
              <option value="">-- Pilih GRN Penerimaan --</option>
              {availableInbounds.map((inb) => (
                <option key={inb.id} value={inb.id}>
                  {inb.grnNumber} - {inb.vendorName} ({inb.poNumber})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-zinc-700 font-semibold mb-1">Tanggal Pengajuan *</label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full text-xs border border-zinc-300 rounded-lg p-2 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 tabular-nums text-zinc-900 bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-700 font-semibold mb-1">
            Pilihan Kompensasi yang Diharapkan *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                compensationType === "POTONG_TAGIHAN"
                  ? "border-zinc-900 bg-zinc-900 text-white font-semibold shadow-sm"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white"
              }`}
            >
              <input
                type="radio"
                name="compType"
                checked={compensationType === "POTONG_TAGIHAN"}
                onChange={() => setCompensationType("POTONG_TAGIHAN")}
                className="accent-zinc-900"
              />
              Debit Note (Potong Faktur)
            </label>
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                compensationType === "GANTI_BARANG"
                  ? "border-zinc-900 bg-zinc-900 text-white font-semibold shadow-sm"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white"
              }`}
            >
              <input
                type="radio"
                name="compType"
                checked={compensationType === "GANTI_BARANG"}
                onChange={() => setCompensationType("GANTI_BARANG")}
                className="accent-zinc-900"
              />
              Tukar Barang Baru
            </label>
            <label
              className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                compensationType === "REFUND_DANA"
                  ? "border-zinc-900 bg-zinc-900 text-white font-semibold shadow-sm"
                  : "border-zinc-200 hover:bg-zinc-50 text-zinc-700 bg-white"
              }`}
            >
              <input
                type="radio"
                name="compType"
                checked={compensationType === "REFUND_DANA"}
                onChange={() => setCompensationType("REFUND_DANA")}
                className="accent-zinc-900"
              />
              Refund Dana Transfer
            </label>
          </div>
        </div>

        {/* Dynamic Items Table */}
        <div className="border border-zinc-200 rounded-xl p-3 bg-zinc-50 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-zinc-700 uppercase text-[10px] tracking-wider">
              Item Barang yang Diretur ({items.length})
            </span>
            <DnaButton type="button" size="sm" variant="secondary" onClick={onAddItem}>
              + Tambah Item
            </DnaButton>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white p-2.5 rounded-lg border border-zinc-200 space-y-2 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-400 w-4">{idx + 1}</span>
                  <div className="w-24">
                    <input
                      placeholder="Kode"
                      value={item.itemCode}
                      onChange={(e) => onUpdateItem(idx, "itemCode", e.target.value)}
                      className="w-full text-xs border border-zinc-200 rounded p-1.5 tabular-nums focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      placeholder="Nama Bahan / Kemasan"
                      value={item.itemName}
                      onChange={(e) => onUpdateItem(idx, "itemName", e.target.value)}
                      className="w-full text-xs border border-zinc-200 rounded p-1.5 focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="w-16">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.qtyReturned}
                      onChange={(e) => onUpdateItem(idx, "qtyReturned", Number(e.target.value))}
                      className="w-full text-xs border border-zinc-200 rounded p-1.5 text-right tabular-nums focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      placeholder="Harga"
                      value={item.unitPrice}
                      onChange={(e) => onUpdateItem(idx, "unitPrice", Number(e.target.value))}
                      className="w-full text-xs border border-zinc-200 rounded p-1.5 text-right tabular-nums focus:border-zinc-900 focus:outline-none"
                    />
                  </div>
                  <div className="w-24 text-right font-semibold text-zinc-900 tabular-nums text-[11px]">
                    Rp {item.totalPrice.toLocaleString("id-ID")}
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(idx)}
                    className="text-zinc-400 hover:text-rose-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <input
                    placeholder="Alasan reject (contoh: Kontaminasi fisik, bocor, kadaluarsa)..."
                    value={item.rejectReason}
                    onChange={(e) => onUpdateItem(idx, "rejectReason", e.target.value)}
                    className="w-full text-xs border border-zinc-200 rounded p-1.5 text-zinc-600 focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-xs">
            <span className="font-semibold text-zinc-700">Total Nilai Debit Note:</span>
            <span className="text-sm font-bold text-zinc-900 tabular-nums">
              Rp {formTotalAmount.toLocaleString("id-ID")}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-zinc-700 font-semibold mb-1">Catatan Tambahan</label>
          <textarea
            rows={2}
            placeholder="Catatan tambahan untuk supplier..."
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            className="w-full text-xs border border-zinc-300 rounded-lg p-2 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900/10 text-zinc-900"
          />
        </div>
      </div>
    </DnaModal>
  );
}
