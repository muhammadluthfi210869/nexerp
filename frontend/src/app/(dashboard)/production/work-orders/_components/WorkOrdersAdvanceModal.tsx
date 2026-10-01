"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import {
  WorkOrderItem,
  AdvanceStageFormData,
  STAGE_LABELS,
  NEXT_STAGE_FLOW,
} from "../_types/work-orders.types";

interface WorkOrdersAdvanceModalProps {
  advanceItem: WorkOrderItem | null;
  onClose: () => void;
  advanceData: AdvanceStageFormData;
  setAdvanceData: React.Dispatch<React.SetStateAction<AdvanceStageFormData>>;
  onSubmit: () => void;
}

export function WorkOrdersAdvanceModal({
  advanceItem,
  onClose,
  advanceData,
  setAdvanceData,
  onSubmit,
}: WorkOrdersAdvanceModalProps) {
  return (
    <DnaModal
      isOpen={!!advanceItem}
      onClose={onClose}
      title={`Majukan Tahap Produksi: ${advanceItem?.code}`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit}>
            Konfirmasi Maju Tahap
          </DnaButton>
        </div>
      }
    >
      {advanceItem && (
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
            <div className="font-semibold text-blue-900">
              {advanceItem.productName} ({advanceItem.brandName})
            </div>
            <div className="text-blue-700">
              Tahap Saat Ini:{" "}
              <span className="font-bold">{STAGE_LABELS[advanceItem.currentStage]?.label}</span>
            </div>
            <div className="text-emerald-800 font-medium">
              Tahap Selanjutnya:{" "}
              <span className="font-bold">
                {STAGE_LABELS[NEXT_STAGE_FLOW[advanceItem.currentStage]]?.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Good Output Qty (PCS)
              </label>
              <DnaInput
                type="number"
                value={advanceData.goodQty.toString()}
                onChange={(e) =>
                  setAdvanceData((prev) => ({ ...prev, goodQty: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Reject Qty (PCS)</label>
              <DnaInput
                type="number"
                value={advanceData.rejectQty.toString()}
                onChange={(e) =>
                  setAdvanceData((prev) => ({ ...prev, rejectQty: Number(e.target.value) }))
                }
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Catatan Verifikasi Tahap
            </label>
            <DnaInput
              placeholder="Catatan parameter, kondisi mesin, atau deviasi jika ada..."
              value={advanceData.notes}
              onChange={(e) =>
                setAdvanceData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>
      )}
    </DnaModal>
  );
}
