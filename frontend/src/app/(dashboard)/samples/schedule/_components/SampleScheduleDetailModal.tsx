"use client";

import React from "react";
import { Printer } from "lucide-react";
import { DnaModal, DnaButton, useDnaToast } from "@/components/dna";
import { ProductionScheduleItem } from "../_types/schedule.types";
import { getStatusBadge } from "./SampleScheduleTable";

interface SampleScheduleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSchedule: ProductionScheduleItem | null;
}

export function SampleScheduleDetailModal({
  isOpen,
  onClose,
  selectedSchedule,
}: SampleScheduleDetailModalProps) {
  const toast = useDnaToast();

  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedSchedule ? `Detail Jadwal: ${selectedSchedule.scheduleCode}` : "Detail"}
      description="Rincian parameter operasional dan instruksi kerja lini."
      size="md"
      footer={
        <div className="flex items-center justify-between w-full">
          <DnaButton
            variant="secondary"
            onClick={() => toast.success("Cetak SPK", "Surat Perintah Kerja jadwal berhasil dicetak.")}
          >
            <Printer className="w-4 h-4 mr-1" /> Cetak SPK
          </DnaButton>
          <DnaButton variant="primary" onClick={onClose}>
            Tutup
          </DnaButton>
        </div>
      }
    >
      {selectedSchedule && (
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="tabular-nums font-bold text-slate-900">
                {selectedSchedule.scheduleCode}
              </span>
              {getStatusBadge(selectedSchedule.status)}
            </div>
            <p className="font-bold text-slate-800 text-sm">{selectedSchedule.productName}</p>
            <p className="text-slate-500">
              {selectedSchedule.clientName} ({selectedSchedule.brandName})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Waktu Pelaksanaan:</span>
              <p className="font-semibold text-slate-900">{selectedSchedule.scheduleDate}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <span className="text-slate-500">Target Qty:</span>
              <p className="tabular-nums font-bold text-slate-900">
                {selectedSchedule.targetQtyPcs.toLocaleString()} Pcs
              </p>
            </div>
          </div>

          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
            <span className="text-slate-500">Mesin / Line Alokasi:</span>
            <p className="font-bold text-slate-900">{selectedSchedule.assignedLineOrMachine}</p>
            <p className="text-slate-600">Operator PIC: {selectedSchedule.picOperator}</p>
          </div>

          {selectedSchedule.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-700">Instruksi Khusus:</span>
              <p className="text-slate-600">{selectedSchedule.notes}</p>
            </div>
          )}
        </div>
      )}
    </DnaModal>
  );
}
