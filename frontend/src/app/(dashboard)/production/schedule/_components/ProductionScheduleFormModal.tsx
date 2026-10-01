"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { ScheduleStage } from "../_types/schedule.types";

interface ProductionScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  workOrders: any[];
  machines: any[];
  formWorkOrderId: string;
  setFormWorkOrderId: (val: string) => void;
  formMachineId: string;
  setFormMachineId: (val: string) => void;
  formSpk: string;
  setFormSpk: (val: string) => void;
  formProduct: string;
  setFormProduct: (val: string) => void;
  formStage: ScheduleStage;
  setFormStage: (val: ScheduleStage) => void;
  formMachine: string;
  setFormMachine: (val: string) => void;
  formStartDate: string;
  setFormStartDate: (val: string) => void;
  formEndDate: string;
  setFormEndDate: (val: string) => void;
  formTargetQty: number;
  setFormTargetQty: (val: number) => void;
  formOperator: string;
  setFormOperator: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
}

export function ProductionScheduleFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  workOrders,
  machines,
  formWorkOrderId,
  setFormWorkOrderId,
  formMachineId,
  setFormMachineId,
  formSpk,
  setFormSpk,
  formProduct,
  setFormProduct,
  formStage,
  setFormStage,
  formMachine,
  setFormMachine,
  formStartDate,
  setFormStartDate,
  formEndDate,
  setFormEndDate,
  formTargetQty,
  setFormTargetQty,
  formOperator,
  setFormOperator,
  formNotes,
  setFormNotes,
}: ProductionScheduleFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Jadwal Produksi Lini"
      size="md"
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
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        {workOrders.length > 0 && (
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Pilih Work Order / SPK</label>
            <select
              aria-label="Pilih Work Order / SPK"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
              value={formWorkOrderId}
              onChange={(e) => {
                const wo = workOrders.find((w: any) => w.id === e.target.value);
                setFormWorkOrderId(e.target.value);
                if (wo) {
                  setFormSpk(wo.woNumber);
                  setFormProduct(wo.productName || "");
                  if (wo.targetQty) setFormTargetQty(Number(wo.targetQty));
                }
              }}
            >
              <option value="">-- Pilih Work Order --</option>
              {workOrders.map((wo: any) => (
                <option key={wo.id} value={wo.id}>
                  {wo.woNumber} - {wo.productName} ({wo.targetQty} Pcs)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              No. SPK Terkait <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              placeholder="SPK-2026-0042"
              value={formSpk}
              onChange={(e) => setFormSpk(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              placeholder="Niacinamide Glow Serum"
              value={formProduct}
              onChange={(e) => setFormProduct(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Tahapan Produksi</label>
            <select
              aria-label="Tahapan Produksi"
              value={formStage}
              onChange={(e) => setFormStage(e.target.value as ScheduleStage)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
            >
              <option value="MIXING">Mixing (Ruahan)</option>
              <option value="FILLING">Filling (Primer)</option>
              <option value="PACKAGING">Packaging (Sekunder)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Mesin / Line</label>
            {machines.length > 0 ? (
              <select
                aria-label="Mesin / Line"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-800"
                value={formMachineId}
                onChange={(e) => {
                  const m = machines.find((item: any) => item.id === e.target.value);
                  setFormMachineId(e.target.value);
                  if (m) setFormMachine(m.name);
                }}
              >
                <option value="">-- Pilih Mesin --</option>
                {machines.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.machineCode})
                  </option>
                ))}
              </select>
            ) : (
              <DnaInput
                value={formMachine}
                onChange={(e) => setFormMachine(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Tanggal Mulai</label>
            <DnaInput
              type="date"
              value={formStartDate}
              onChange={(e) => setFormStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Tanggal Selesai</label>
            <DnaInput
              type="date"
              value={formEndDate}
              onChange={(e) => setFormEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Target Qty</label>
            <DnaInput
              type="number"
              value={formTargetQty.toString()}
              onChange={(e) => setFormTargetQty(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">PIC Operator</label>
            <DnaInput
              value={formOperator}
              onChange={(e) => setFormOperator(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Catatan Khusus</label>
          <DnaInput
            placeholder="Instruksi mesin, kebersihan bejana, dll..."
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
        </div>
      </form>
    </DnaModal>
  );
}
