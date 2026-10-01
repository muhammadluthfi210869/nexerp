"use client";

import React from "react";
import { DnaModal, DnaInput, DnaButton } from "@/components/dna";
import { NewChecklistForm } from "../_types";

interface ChecklistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: NewChecklistForm;
  onFormChange: (data: NewChecklistForm) => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function ChecklistFormModal({
  isOpen,
  onClose,
  formData,
  onFormChange,
  onSubmit,
  isPending,
}: ChecklistFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Checklist Operasional Sales Order Baru"
      subtitle="Daftarkan sales order maklon ke dalam sistem tracking checklist."
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Checklist *</label>
          <DnaInput
            value={formData.title}
            onChange={(e) => onFormChange({ ...formData, title: e.target.value })}
            placeholder="Contoh: Checklist Batch SO-2026-0525"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Work Order ID <span className="text-slate-400 font-normal">(opsional)</span>
          </label>
          <DnaInput
            value={formData.workOrderId}
            onChange={(e) => onFormChange({ ...formData, workOrderId: e.target.value })}
            placeholder="UUID work order"
          />
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Endpoint <span className="font-mono">POST /qc/checklists</span> hanya menerima judul, work order,
          dan daftar item. Tanpa daftar item, backend memakai 9 kategori kronologis baku.
        </p>
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <DnaButton variant="secondary" onClick={onClose}>Batal</DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isPending}>
            {isPending ? "Menyimpan..." : "Simpan & Daftarkan Checklist"}
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
