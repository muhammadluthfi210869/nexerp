import React from "react";
import { DnaModal, DnaButton, formatRupiah } from "@/components/dna";
import { QuarantineItem } from "../_types/karantina.types";

interface KarantinaDetailModalProps {
  selectedDetail: QuarantineItem | null;
  onClose: () => void;
}

export const KarantinaDetailModal: React.FC<KarantinaDetailModalProps> = ({
  selectedDetail,
  onClose,
}) => {
  return (
    <DnaModal
      isOpen={!!selectedDetail}
      onClose={onClose}
      title={`Detail Investigasi Karantina: ${selectedDetail?.quarantineNo || selectedDetail?.code || ""}`}
      subtitle={`No. GRN: ${selectedDetail?.grnNo || "-"} • Supplier: ${selectedDetail?.supplierName || "-"}`}
      size="md"
    >
      <div className="space-y-3 text-xs">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Material:</span>
            <strong className="text-slate-800">
              {selectedDetail?.materialCode} - {selectedDetail?.materialName}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Lot / Batch Supplier:</span>
            <strong className="text-slate-800">
              {selectedDetail?.supplierLotBatch || selectedDetail?.batchNo || "-"}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Gudang Karantina:</span>
            <strong className="text-slate-800">{selectedDetail?.warehouse}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kuantitas Karantina:</span>
            <strong className="text-rose-700 font-bold">
              {selectedDetail?.qty} {selectedDetail?.unit}
            </strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jenis Cacat:</span>
            <strong className="text-slate-800">{selectedDetail?.defectType}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Lokasi Temuan:</span>
            <strong className="text-slate-800">{selectedDetail?.defectLocation}</strong>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-900 font-bold">Taksiran Nilai Scrap:</span>
            <strong className="text-rose-700 font-black text-sm">
              {selectedDetail ? formatRupiah(selectedDetail.estimatedValue) : "0"}
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
};
