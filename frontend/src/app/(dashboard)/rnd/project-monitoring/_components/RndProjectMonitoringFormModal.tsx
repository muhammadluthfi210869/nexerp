"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { CreateProjectFormData, LeadOption } from "../_types/project-monitoring.types";

interface RndProjectMonitoringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateProjectFormData;
  setForm: React.Dispatch<React.SetStateAction<CreateProjectFormData>>;
  leads: LeadOption[];
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function RndProjectMonitoringFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  leads,
  onSubmit,
  isSubmitting,
}: RndProjectMonitoringFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Inisiasi Proyek R&D & Formulasi Baru"
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Daftarkan Proyek"}
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {leads && leads.length > 0 && (
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Pilih Lead / Klien</label>
            <select
              aria-label="Pilih Lead / Klien"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              value={form.leadId}
              onChange={(e) => setForm((prev) => ({ ...prev, leadId: e.target.value }))}
            >
              <option value="">-- Pilih Lead --</option>
              {leads.map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.clientName} {l.brandName ? `(${l.brandName})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Nama Produk Formulasi *</label>
          <DnaInput
            placeholder="Contoh: Hydrating Sunscreen Gel SPF 50"
            value={form.productName}
            onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Fungsi / Klaim Utama</label>
          <DnaInput
            placeholder="Contoh: UV Protection, Calming, Barrier Repair"
            value={form.targetFunction}
            onChange={(e) => setForm((prev) => ({ ...prev, targetFunction: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Tekstur</label>
            <DnaInput
              value={form.textureReq}
              onChange={(e) => setForm((prev) => ({ ...prev, textureReq: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Warna</label>
            <DnaInput
              value={form.colorReq}
              onChange={(e) => setForm((prev) => ({ ...prev, colorReq: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Aroma</label>
            <DnaInput
              value={form.aromaReq}
              onChange={(e) => setForm((prev) => ({ ...prev, aromaReq: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Target Deadline Formulasi</label>
          <DnaInput
            type="date"
            value={form.targetDeadline}
            onChange={(e) => setForm((prev) => ({ ...prev, targetDeadline: e.target.value }))}
          />
        </div>
      </div>
    </DnaModal>
  );
}
