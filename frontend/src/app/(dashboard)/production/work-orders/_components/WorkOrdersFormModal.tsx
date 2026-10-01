"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { CreateWorkOrderFormData } from "../_types/work-orders.types";

interface WorkOrdersFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: CreateWorkOrderFormData;
  setFormData: React.Dispatch<React.SetStateAction<CreateWorkOrderFormData>>;
  onSubmit: (e?: React.FormEvent) => void;
}

export function WorkOrdersFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: WorkOrdersFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Surat Perintah Kerja (SPK) Baru"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={() => onSubmit()}>
            Terbitkan SPK
          </DnaButton>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-3 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              No. Sales Order (SO) <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              placeholder="SO-2026-0195"
              value={formData.soCode}
              onChange={(e) => setFormData((prev) => ({ ...prev, soCode: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Nama Klien <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              placeholder="PT Cantika Jelita"
              value={formData.customer}
              onChange={(e) => setFormData((prev) => ({ ...prev, customer: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Nama Brand <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              placeholder="GlowGoddess"
              value={formData.brand}
              onChange={(e) => setFormData((prev) => ({ ...prev, brand: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Nama Produk Maklon <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              placeholder="Ceramide Barrier Cream"
              value={formData.product}
              onChange={(e) => setFormData((prev) => ({ ...prev, product: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">
              Target Qty (PCS) <span className="text-rose-500">*</span>
            </label>
            <DnaInput
              type="number"
              value={formData.targetQty.toString()}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetQty: Number(e.target.value) }))
              }
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Netto Kemasan</label>
            <DnaInput
              placeholder="30 ml"
              value={formData.netto}
              onChange={(e) => setFormData((prev) => ({ ...prev, netto: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Tanggal Mulai</label>
            <DnaInput
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Target Selesai</label>
            <DnaInput
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, targetDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Instruksi Khusus</label>
          <DnaInput
            placeholder="Instruksi bejana, spesifikasi kemasan, atau catatan penimbangan..."
            value={formData.notes}
            onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </form>
    </DnaModal>
  );
}
