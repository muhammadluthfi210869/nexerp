"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import { ScheduleMixingItem } from "../_types/schedule-mixing.types";

interface ScheduleMixingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: ScheduleMixingItem | null;
}

export function ScheduleMixingDetailDrawer({
  isOpen,
  onClose,
  selectedItem,
}: ScheduleMixingDetailDrawerProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Jadwal Mixing: ${selectedItem?.code || ""}`}
      size="lg"
    >
      {selectedItem && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Kode Jadwal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.code}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Tanggal</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.date}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Batch Record</p>
              <p className="text-xs font-bold text-blue-600 mt-0.5">{selectedItem.batchRecord}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Sales Order Ref</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.salesOrder}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Pelanggan</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.customer}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Produk</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.product}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Target Qty</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedItem.targetPcs.toLocaleString()} PCS</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase">Hasil Upscale</p>
              <p className="text-xs font-bold text-emerald-600 mt-0.5">{selectedItem.upscaleResult} {selectedItem.unit}</p>
            </div>
          </div>

          {selectedItem.notes && (
            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
              <span className="font-bold">Instruksi Khusus Mixing:</span> {selectedItem.notes}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <DnaButton variant="secondary" onClick={onClose}>
              Tutup
            </DnaButton>
          </div>
        </div>
      )}
    </DnaModal>
  );
}
