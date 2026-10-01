"use client";

import React from "react";
import { DnaModal, DnaButton } from "@/components/dna";
import { CreateScheduleFormData, ScheduleType } from "../_types/schedule.types";

interface SampleScheduleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalScheduleType: ScheduleType;
  setModalScheduleType: (type: ScheduleType) => void;
  createForm: CreateScheduleFormData;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateScheduleFormData>>;
  workOrders: any[];
  machines: any[];
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function SampleScheduleCreateModal({
  isOpen,
  onClose,
  modalScheduleType,
  setModalScheduleType,
  createForm,
  setCreateForm,
  workOrders,
  machines,
  isSubmitting,
  onSubmit,
}: SampleScheduleCreateModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Buat Jadwal ${modalScheduleType} Baru`}
      description="Perencanaan slot mesin dan penugasan operator lini pra-produksi."
      size="lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Tipe Jadwal Proses *</label>
            <select
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800"
              value={modalScheduleType}
              onChange={(e) => setModalScheduleType(e.target.value as ScheduleType)}
            >
              <option value="MIXING">Mixing (Bejana Homogenizer)</option>
              <option value="FILLING">Filling (Pengisian Kemasan Primer)</option>
              <option value="PACKAGING">Packaging (Inner Box & Master Carton)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Work Order Acuan *</label>
            <select
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 tabular-nums text-slate-800"
              value={createForm.workOrderId}
              onChange={(e) => {
                const wo = workOrders.find((w: any) => w.id === e.target.value);
                setCreateForm((prev) => ({
                  ...prev,
                  workOrderId: e.target.value,
                  batchRecordCode: wo?.woNumber || prev.batchRecordCode,
                  targetQtyPcs: wo?.targetQty ? Number(wo.targetQty) : prev.targetQtyPcs,
                }));
              }}
            >
              <option value="">-- Pilih Work Order --</option>
              {workOrders.map((wo: any) => (
                <option key={wo.id} value={wo.id}>
                  {wo.woNumber} - {wo.productName || "Produk"} ({wo.targetQty || 0} Pcs)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Waktu Pelaksanaan *</label>
            <input
              type="datetime-local"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 tabular-nums text-slate-800"
              value={createForm.scheduleDate.replace(" ", "T")}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, scheduleDate: e.target.value.replace("T", " ") }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Target Qty (PCS) *</label>
            <input
              type="number"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 tabular-nums font-bold text-slate-900"
              value={createForm.targetQtyPcs}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, targetQtyPcs: Number(e.target.value) }))
              }
            />
          </div>
        </div>

        {modalScheduleType === "MIXING" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <span className="font-bold text-blue-900 uppercase">Perhitungan Upscale Bejana Mixing:</span>
            <div className="grid grid-cols-2 gap-3 text-blue-800 tabular-nums">
              <div>Base Result: {(createForm.targetQtyPcs * 0.03).toFixed(1)} Kg</div>
              <div>Upscale Buffer: +10% ({(createForm.targetQtyPcs * 0.033).toFixed(1)} Kg)</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Mesin / Lini Alokasi *</label>
            {machines.length > 0 ? (
              <select
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.machineId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, machineId: e.target.value }))}
              >
                <option value="">-- Pilih Mesin --</option>
                {machines.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machineCode})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
                value={createForm.assignedMachine}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, assignedMachine: e.target.value }))
                }
              />
            )}
          </div>
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase">Operator PIC *</label>
            <input
              type="text"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800"
              value={createForm.picOperator}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, picOperator: e.target.value }))
              }
            />
          </div>
        </div>
      </div>
    </DnaModal>
  );
}
