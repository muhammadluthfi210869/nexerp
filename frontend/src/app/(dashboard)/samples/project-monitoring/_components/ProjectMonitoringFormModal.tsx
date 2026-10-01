"use client";

import React from "react";
import { DnaModal, DnaButton, DnaInput } from "@/components/dna";
import { CreateProjectForm, LeadOption } from "../_types/project-monitoring.types";

interface ProjectMonitoringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: CreateProjectForm;
  setForm: React.Dispatch<React.SetStateAction<CreateProjectForm>>;
  leads: LeadOption[];
  onLeadChange: (leadId: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ProjectMonitoringFormModal({
  isOpen,
  onClose,
  form,
  setForm,
  leads,
  onLeadChange,
  onSubmit,
  isSubmitting,
}: ProjectMonitoringFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Project R&D Baru"
      description="Pendaftaran project formulasi baru dari dokumen NPF (New Product Formulation)."
      size="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <DnaButton variant="secondary" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Project"}
          </DnaButton>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {leads && leads.length > 0 && (
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Pilih Lead / Klien Terdaftar</label>
            <select
              aria-label="Pilih Lead / Klien Terdaftar"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              value={form.leadId}
              onChange={(e) => onLeadChange(e.target.value)}
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
          <label className="font-bold text-slate-700 uppercase">Nama Project Formulasi *</label>
          <DnaInput
            placeholder="Contoh: Serum Anti-Aging Peptide 5% + Bakuchiol"
            value={form.projectName}
            onChange={(e) => setForm((prev) => ({ ...prev, projectName: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nama Klien *</label>
            <DnaInput
              placeholder="PT Cantika Nusantara"
              value={form.clientName}
              onChange={(e) => setForm((prev) => ({ ...prev, clientName: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Nama Brand</label>
            <DnaInput
              placeholder="GlowSkin"
              value={form.brandName}
              onChange={(e) => setForm((prev) => ({ ...prev, brandName: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Tgl Masuk NPF</label>
            <DnaInput
              type="date"
              value={form.npfEntryDate}
              onChange={(e) => setForm((prev) => ({ ...prev, npfEntryDate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase">Target Selesai Formulasi</label>
            <DnaInput
              type="date"
              value={form.targetFinishDate}
              onChange={(e) => setForm((prev) => ({ ...prev, targetFinishDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Link Folder Formula (Drive)</label>
          <DnaInput
            placeholder="https://drive.google.com/drive/folders/..."
            value={form.formulaFolderUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, formulaFolderUrl: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <label className="font-bold text-slate-700 uppercase">Catatan Spesifikasi</label>
          <DnaInput
            placeholder="Tekstur, warna, target pH, active ingredients..."
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </div>
    </DnaModal>
  );
}
