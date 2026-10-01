"use client";

import React from "react";
import {
  DnaModal,
  DnaInput,
  DnaSelect,
  DnaButton,
} from "@/components/dna";
import type { ComplianceAssetType } from "../_types/compliance-asset.types";

interface ComplianceAssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formName: string;
  setFormName: (val: string) => void;
  formCode: string;
  setFormCode: (val: string) => void;
  formType: ComplianceAssetType;
  setFormType: (val: ComplianceAssetType) => void;
  formBrand: string;
  setFormBrand: (val: string) => void;
  formDate: string;
  setFormDate: (val: string) => void;
  formMonths: string;
  setFormMonths: (val: string) => void;
  formCost: string;
  setFormCost: (val: string) => void;
  formNotes: string;
  setFormNotes: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export function ComplianceAssetFormModal({
  isOpen,
  onClose,
  formName,
  setFormName,
  formCode,
  setFormCode,
  formType,
  setFormType,
  formBrand,
  setFormBrand,
  formDate,
  setFormDate,
  formMonths,
  setFormMonths,
  formCost,
  setFormCost,
  formNotes,
  setFormNotes,
  onSubmit,
  isSaving,
}: ComplianceAssetFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrasi Aset Tak Berwujud / Sertifikasi Baru"
      size="md"
    >
      <form onSubmit={onSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-semibold text-slate-700 block mb-1">Nama Sertifikasi / Izin / Lisensi *</label>
          <DnaInput
            placeholder="Misal: Izin Edar BPOM NA Serum Brightening"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Nomor Izin / Registrasi</label>
            <DnaInput
              placeholder="Misal: BPOM-NA-182601990"
              value={formCode}
              onChange={(e) => setFormCode(e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Kategori Dokumen *</label>
            <DnaSelect
              value={formType}
              onChange={(v) => setFormType(v as ComplianceAssetType)}
              options={[
                { value: "BPOM", label: "Izin Edar BPOM" },
                { value: "HALAL", label: "Sertifikasi Halal MUI / BPJPH" },
                { value: "ISO", label: "Sertifikasi ISO / CPKB" },
                { value: "HKI", label: "Hak Kekayaan Intelektual (Merk/Paten)" },
                { value: "LAINNYA", label: "Lisensi Software & Lainnya" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Brand / Entitas Terkait</label>
            <DnaInput
              placeholder="Misal: Glow & Co"
              value={formBrand}
              onChange={(e) => setFormBrand(e.target.value)}
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Masa Amortisasi (Bulan) *</label>
            <DnaInput
              type="number"
              min="1"
              value={formMonths}
              onChange={(e) => setFormMonths(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Tanggal Terbit / Perolehan *</label>
            <DnaInput
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Biaya Perolehan / Retribusi (Rp) *</label>
            <DnaInput
              type="number"
              min="1000"
              placeholder="Misal: 7500000"
              value={formCost}
              onChange={(e) => setFormCost(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-slate-700 block mb-1">Catatan Tambahan</label>
          <DnaInput
            placeholder="Keterangan perpanjangan atau batch terkait"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose} type="button">
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" type="submit" disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Daftarkan Aset"}
          </DnaButton>
        </div>
      </form>
    </DnaModal>
  );
}
