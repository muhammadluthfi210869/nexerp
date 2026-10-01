import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { FillingProductionItem } from "../_types/filling.types";

interface FillingFormModalProps {
  item: FillingProductionItem | null;
  onClose: () => void;
  produceQty: number;
  onProduceQtyChange: (qty: number) => void;
  rejectQty: number;
  onRejectQtyChange: (qty: number) => void;
  produceMachine: string;
  onProduceMachineChange: (machine: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FillingFormModal({
  item,
  onClose,
  produceQty,
  onProduceQtyChange,
  rejectQty,
  onRejectQtyChange,
  produceMachine,
  onProduceMachineChange,
  onSubmit,
}: FillingFormModalProps) {
  return (
    <DnaModal
      isOpen={!!item}
      onClose={onClose}
      title={`Konfirmasi Selesai Filling: ${item?.code || ""}`}
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
      {item && (
        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-1">
            <div className="font-bold text-blue-900">{item.product}</div>
            <div className="text-blue-700">Target Order: {item.targetPcs.toLocaleString()} Pcs</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">
                Jumlah Good Pcs <span className="text-rose-500">*</span>
              </label>
              <DnaInput
                type="number"
                value={produceQty.toString()}
                onChange={(e) => onProduceQtyChange(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700 uppercase">Jumlah Reject Pcs</label>
              <DnaInput
                type="number"
                value={rejectQty.toString()}
                onChange={(e) => onRejectQtyChange(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Lini Mesin Filling</label>
            <DnaInput
              value={produceMachine}
              onChange={(e) => onProduceMachineChange(e.target.value)}
            />
          </div>
        </form>
      )}
    </DnaModal>
  );
}
