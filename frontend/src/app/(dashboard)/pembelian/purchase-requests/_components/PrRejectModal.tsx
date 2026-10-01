"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import type { PurchaseRequestRecord } from "../_types/purchase-requests.types";

interface PrRejectModalProps {
  rejectModalPr: PurchaseRequestRecord | null;
  rejectReason: string;
  onReasonChange: (val: string) => void;
  onClose: () => void;
  onConfirmReject: () => void;
}

export function PrRejectModal({
  rejectModalPr,
  rejectReason,
  onReasonChange,
  onClose,
  onConfirmReject,
}: PrRejectModalProps) {
  return (
    <DnaModal
      isOpen={!!rejectModalPr}
      onClose={onClose}
      title="Tolak Permintaan Pembelian"
      size="sm"
    >
      {rejectModalPr && (
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Anda akan menolak pengajuan <span className="font-bold text-slate-900">{rejectModalPr.prCode}</span>.
            Mohon berikan catatan alasan penolakan untuk evaluasi departemen terkait.
          </p>
          <div>
            <label className="font-bold text-slate-700 block mb-1">Catatan Alasan Penolakan *</label>
            <textarea
              className="w-full h-24 p-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              placeholder="Contoh: Buffer stock di gudang masih mencukupi 2 minggu produksi..."
              value={rejectReason}
              onChange={(e) => onReasonChange(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <DnaButton variant="secondary" onClick={onClose}>
              Batal
            </DnaButton>
            <DnaButton variant="danger" onClick={onConfirmReject}>
              Konfirmasi Tolak PR
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
