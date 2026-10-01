"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { MixingProductionItem } from "../_types/mixing.types";

interface MixingFormModalProps {
  item: MixingProductionItem | null;
  onClose: () => void;
  actualProduceQty: number;
  onActualProduceQtyChange: (val: number) => void;
  produceNote: string;
  onProduceNoteChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function MixingFormModal({
  item,
  onClose,
  actualProduceQty,
  onActualProduceQtyChange,
  produceNote,
  onProduceNoteChange,
  onSubmit,
}: MixingFormModalProps) {
  return (
    <DnaModal
      isOpen={!!item}
      onClose={onClose}
      title={`Konfirmasi Selesai Mixing: ${item?.scheduleCode}`}
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
            <div className="text-blue-700">Target Upscale: {item.upscaleResultKg.toFixed(1)} Kg</div>
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Hasil Timbangan Riil Ruahan (Kg) <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              type="number"
              value={actualProduceQty.toString()}
              onChange={(e) => onActualProduceQtyChange(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Catatan Pelaksanaan Mixing</label>
            <DnaInput
              placeholder="Homogenitas ruahan, suhu akhir emulsi, dll..."
              value={produceNote}
              onChange={(e) => onProduceNoteChange(e.target.value)}
            />
          </div>
        </form>
      )}
    </DnaModal>
  );
}
