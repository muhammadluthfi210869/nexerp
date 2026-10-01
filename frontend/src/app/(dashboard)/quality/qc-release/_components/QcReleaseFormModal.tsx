import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { QcReleaseBatchItem } from "../_types/qc-release.types";

interface QcReleaseFormModalProps {
  releaseModalItem: QcReleaseBatchItem | null;
  onClose: () => void;
  apjName: string;
  setApjName: (val: string) => void;
  apjSipa: string;
  setApjSipa: (val: string) => void;
  apjNotes: string;
  setApjNotes: (val: string) => void;
  agreeCheck: boolean;
  setAgreeCheck: (val: boolean) => void;
  isSubmitting: boolean;
  onExecuteRelease: () => void;
}

export function QcReleaseFormModal({
  releaseModalItem,
  onClose,
  apjName,
  setApjName,
  apjSipa,
  setApjSipa,
  apjNotes,
  setApjNotes,
  agreeCheck,
  setAgreeCheck,
  isSubmitting,
  onExecuteRelease,
}: QcReleaseFormModalProps) {
  return (
    <DnaModal
      isOpen={!!releaseModalItem}
      onClose={onClose}
      title={`Otorisasi Rilis Resmi APJ: ${releaseModalItem?.batchNumber}`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            onClick={onExecuteRelease}
            disabled={isSubmitting || !agreeCheck}
          >
            {isSubmitting ? "Memproses..." : "Tandatangani & Rilis"}
          </DnaButton>
        </div>
      }
    >
      {releaseModalItem && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1">
            <div className="font-bold text-emerald-950">{releaseModalItem.productName}</div>
            <p className="text-emerald-900 font-semibold">
              Verifikasi Pelepasan Batch Sesuai Regulasi CPKB
            </p>
            <p className="text-emerald-800">
              Kuantitas Rilis: <span className="font-bold">{releaseModalItem.outputQty.toLocaleString()} Pcs</span> ke Gudang Produk Jadi (WH-03)
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nama Apoteker Penanggung Jawab (APJ)</label>
            <DnaInput
              value={apjName}
              onChange={(e) => setApjName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nomor Surat Izin Praktik Apoteker (SIPA)</label>
            <DnaInput
              value={apjSipa}
              onChange={(e) => setApjSipa(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Pelepasan Batch</label>
            <DnaInput
              value={apjNotes}
              onChange={(e) => setApjNotes(e.target.value)}
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2">
            <input
              type="checkbox"
              id="agree-release"
              checked={agreeCheck}
              onChange={(e) => setAgreeCheck(e.target.checked)}
              className="mt-0.5"
            />
            <label htmlFor="agree-release" className="text-slate-700 font-medium">
              Saya menyatakan dengan penuh tanggung jawab kefarmasian bahwa seluruh parameter mutu telah lolos uji CPKB.
            </label>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
