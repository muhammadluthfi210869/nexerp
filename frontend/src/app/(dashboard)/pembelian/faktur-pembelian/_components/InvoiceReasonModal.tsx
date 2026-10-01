"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import { PurchaseBill } from "../_types/faktur-pembelian.types";

interface InvoiceReasonModalProps {
  reasonModalBill: PurchaseBill | null;
  onClose: () => void;
  newReasonText: string;
  onReasonTextChange: (val: string) => void;
  onSaveReason: () => void;
}

export function InvoiceReasonModal({
  reasonModalBill,
  onClose,
  newReasonText,
  onReasonTextChange,
  onSaveReason,
}: InvoiceReasonModalProps) {
  if (!reasonModalBill) return null;

  return (
    <DnaModal
      isOpen={!!reasonModalBill}
      onClose={onClose}
      title={`Catatan Alasan Belum Lunas: ${reasonModalBill.billNumber}`}
      description={`Update alasan mengapa faktur dari ${reasonModalBill.vendorName} belum dibayarkan.`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2.5 w-full">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="sm" onClick={onSaveReason}>
            Simpan Catatan
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-3 text-xs">
        <label className="block text-slate-700 font-bold">Alasan Belum Lunas *</label>
        <textarea
          rows={3}
          value={newReasonText}
          onChange={(e) => onReasonTextChange(e.target.value)}
          placeholder="Contoh: Menunggu termin 30 hari, barang reject dalam proses penggantian..."
          className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    </DnaModal>
  );
}
