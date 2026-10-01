import React from "react";
import { DnaModal, DnaButton, formatRupiah } from "@/components/dna";
import type { ApAgingItem } from "../_types/ap-aging.types";

interface ApAgingDetailModalProps {
  selectedInvoice: ApAgingItem | null;
  onClose: () => void;
}

export function ApAgingDetailModal({
  selectedInvoice,
  onClose,
}: ApAgingDetailModalProps) {
  return (
    <DnaModal
      isOpen={!!selectedInvoice}
      onClose={onClose}
      title={`Detail Faktur Pembelian: ${selectedInvoice?.invoiceNo}`}
      size="md"
    >
      <div className="space-y-3.5 text-xs">
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Nama Vendor:</span>
            <strong className="text-slate-900">{selectedInvoice?.vendor}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Deadline Pembayaran:</span>
            <strong className="text-rose-700">{selectedInvoice?.deadline}</strong>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-900 font-bold">Total Nilai Tagihan:</span>
            <strong className="text-rose-700 font-black text-sm">
              {selectedInvoice ? formatRupiah(selectedInvoice.amount) : "0"}
            </strong>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}

// Alias for flexibility / compatibility
export const ApAgingDetailDrawer = ApAgingDetailModal;
