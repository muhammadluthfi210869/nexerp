"use client";

import React from "react";
import { Upload } from "lucide-react";
import {
  DnaModal,
  DnaButton,
  DnaInput,
  DnaSelect,
  DnaTextarea,
} from "@/components/dna";
import type { FundRequestFormData } from "../_types/fund-requests.types";

interface FundRequestsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: FundRequestFormData;
  setFormData: React.Dispatch<React.SetStateAction<FundRequestFormData>>;
  onSubmit: () => void;
}

export function FundRequestsFormModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}: FundRequestsFormModalProps) {
  return (
    <DnaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Form Pengajuan Dana Operasional (Fund Request)"
      size="md"
    >
      <div className="space-y-3.5 text-xs">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Jenjang Pengaju *</label>
            <DnaSelect
              value={formData.level}
              onChange={(value) => setFormData({ ...formData, level: value as any })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              <option value="STAFF">Staff (Alur: Head ke Accounting ke Direktur)</option>
              <option value="HEAD_DIVISI">Head Divisi (Alur: Langsung Accounting ke Direktur)</option>
            </DnaSelect>
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Departemen *</label>
            <DnaSelect
              value={formData.department}
              onChange={(value) => setFormData({ ...formData, department: value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium"
            >
              <option value="Produksi Manufaktur">Produksi Manufaktur</option>
              <option value="Gudang & Logistik">Gudang & Logistik</option>
              <option value="R&D Formulasi">R&D Formulasi</option>
              <option value="Quality Control (QC)">Quality Control (QC)</option>
              <option value="Business Development">Business Development</option>
            </DnaSelect>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nama Pemohon *</label>
            <DnaInput
              type="text"
              placeholder="e.g. Ahmad Staff Gudang"
              value={formData.applicant}
              onChange={(e) => setFormData({ ...formData, applicant: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Tanggal Dibutuhkan *</label>
            <DnaInput
              type="date"
              value={formData.requiredDate}
              onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1">Tujuan / Keperluan Dana *</label>
          <DnaTextarea
            rows={3}
            placeholder="Jelaskan secara rinci kebutuhan dan tujuan penggunaan dana..."
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Nominal yang Diajukan (Rp) *</label>
            <DnaInput
              type="number"
              placeholder="e.g. 7500000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-blue-700"
            />
          </div>
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Lampiran Bukti / Invoice Penawaran</label>
            <div className="flex items-center gap-2 border border-dashed border-slate-300 rounded-lg p-2 bg-slate-50 cursor-pointer">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] text-slate-500">Upload file PDF/JPG...</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <DnaButton variant="secondary" size="md" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onSubmit}>
            Submit Pengajuan
          </DnaButton>
        </div>
      </div>
    </DnaModal>
  );
}
