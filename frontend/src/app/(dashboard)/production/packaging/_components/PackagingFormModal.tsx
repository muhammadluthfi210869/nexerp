import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import type { PackagingProductionItem } from "../_types/packaging.types";

interface PackagingFormModalProps {
  produceModalItem: PackagingProductionItem | null;
  onClose: () => void;
  produceQty: number;
  setProduceQty: (value: number) => void;
  rejectQty: number;
  setRejectQty: (value: number) => void;
  produceMachine: string;
  setProduceMachine: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function PackagingFormModal({
  produceModalItem,
  onClose,
  produceQty,
  setProduceQty,
  rejectQty,
  setRejectQty,
  produceMachine,
  setProduceMachine,
  onSubmit,
}: PackagingFormModalProps) {
  return (
    <DnaModal
      isOpen={!!produceModalItem}
      onClose={onClose}
      title={`Konfirmasi Selesai Packaging: ${produceModalItem?.code}`}
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit}>
            Simpan Realisasi
          </DnaButton>
        </div>
      }
    >
      {produceModalItem && (
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
            <div className="font-bold text-blue-900">{produceModalItem.product}</div>
            <div className="text-blue-700">Target Order: {produceModalItem.targetPcs.toLocaleString()} Pcs</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Jumlah Good Pcs <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                type="number"
                value={produceQty.toString()}
                onChange={(e) => setProduceQty(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Jumlah Reject Pcs</label>
              <DnaInput
                type="number"
                value={rejectQty.toString()}
                onChange={(e) => setRejectQty(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Lini Mesin Packaging</label>
            <DnaInput
              value={produceMachine}
              onChange={(e) => setProduceMachine(e.target.value)}
            />
          </div>
        </form>
      )}
    </DnaModal>
  );
}
