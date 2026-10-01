"use client";

import React from "react";
import { DnaModal, DnaButton, DnaBadge } from "@/components/dna";
import {
  NpfSampleRow,
  STAGE_LABEL,
  STAGE_VARIANT,
  fmtDate,
} from "../_types/npf.types";

interface NpfDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedNpf: NpfSampleRow | null;
}

export function NpfDetailModal({
  isOpen,
  onClose,
  selectedNpf,
}: NpfDetailModalProps) {
  const getStatusBadge = (stage: string) => (
    <DnaBadge variant={STAGE_VARIANT[stage] ?? "neutral"}>{STAGE_LABEL[stage] ?? stage}</DnaBadge>
  );

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Rincian Dokumen NPF & Spesifikasi Sample"
      description="Detail parameter intake formulasi dan riwayat review."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      }
    >
      {selectedNpf && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">Kode Sample</span>
                <p className="tabular-nums text-base font-bold text-slate-900">{selectedNpf.sampleCode}</p>
              </div>
              <div>{getStatusBadge(selectedNpf.stage)}</div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Klien & Brand:</span>
                <p className="font-semibold text-slate-800">{selectedNpf.clientName} ({selectedNpf.brandName})</p>
              </div>
              <div>
                <span className="text-slate-500">Formulator PIC:</span>
                <p className="font-semibold text-slate-800">{selectedNpf.formulatorPic}</p>
              </div>
              <div>
                <span className="text-slate-500">Fungsi Target:</span>
                <p className="font-bold text-indigo-700">{selectedNpf.targetFunction}</p>
              </div>
              <div>
                <span className="text-slate-500">Target HPP:</span>
                <p className="tabular-nums font-bold text-slate-800">
                  {selectedNpf.targetHppPrice > 0
                    ? `Rp ${selectedNpf.targetHppPrice.toLocaleString("id-ID")}`
                    : "â€”"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-500">Tanggal Permintaan:</span>
                <p className="font-semibold text-slate-800">{selectedNpf.entryDate}</p>
              </div>
              <div>
                <span className="text-slate-500">Target Deadline:</span>
                <p className="font-semibold text-slate-800">{fmtDate(selectedNpf.targetDeadline)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase text-[11px]">Spesifikasi Tekstur, Warna & Aroma</span>
              <p className="text-slate-600"><strong className="text-slate-800">Tekstur:</strong> {selectedNpf.textureReq}</p>
              <p className="text-slate-600"><strong className="text-slate-800">Warna:</strong> {selectedNpf.colorReq}</p>
              <p className="text-slate-600"><strong className="text-slate-800">Aroma:</strong> {selectedNpf.aromaReq}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-700 uppercase text-[11px]">Pengiriman & Revisi</span>
              <p className="text-slate-600"><strong className="text-slate-800">Kurir:</strong> {selectedNpf.courier || "â€”"}</p>
              <p className="text-slate-600"><strong className="text-slate-800">No. Resi:</strong> {selectedNpf.trackingAwb || "â€”"}</p>
              <p className="text-slate-600"><strong className="text-slate-800">Revisi:</strong> {selectedNpf.currentRevision}</p>
            </div>
          </div>

          {selectedNpf.clientFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-emerald-900">Feedback Resmi Klien:</span>
              <p className="text-emerald-800">{selectedNpf.clientFeedback}</p>
            </div>
          )}
        </div>
      )}
    </DnaModal>
  );
}

export { NpfDetailModal as NpfDetailDrawer };
