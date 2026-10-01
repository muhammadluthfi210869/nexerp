"use client";

import React from "react";
import {
  UserCheck,
  Building2,
  Calendar,
  DollarSign,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import {
  DnaCard,
  DnaButton,
  DnaInput,
  DnaSelect,
  formatRupiah,
} from "@/components/dna";
import type { FundRequestFormData } from "../_types/fund-requests.types";

interface FundRequestsCreateCanvasProps {
  onClose: () => void;
  formData: FundRequestFormData;
  setFormData: React.Dispatch<React.SetStateAction<FundRequestFormData>>;
  onSubmit: () => void;
}

export function FundRequestsCreateCanvas({
  onClose,
  formData,
  setFormData,
  onSubmit,
}: FundRequestsCreateCanvasProps) {
  const numericAmount = Number(formData.amount) || 0;

  return (
    <div className="space-y-6">
      {/* Header Canvas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900">Form Pengajuan Dana Operasional (Fund Request)</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              🏷️ Auto-Number: REQ-{new Date().getFullYear()}-XXXX
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Alur pengajuan dana operasional bertingkat (3-Tier Governance) dengan pencatatan otomatis ke kas keluar saat pencairan.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <DnaButton variant="outline" size="sm" onClick={onClose}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="sm"
            icon={<CheckCircle2 className="w-4 h-4" />}
            onClick={onSubmit}
            disabled={numericAmount <= 0 || !formData.applicant || !formData.purpose}
          >
            Submit Pengajuan Dana
          </DnaButton>
        </div>
      </div>

      {/* 2-Column Upper Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Pemohon & Departemen */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Building2 className="w-4 h-4 text-blue-600" />
              1. Identitas Pemohon & Jenjang Approval
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenjang Pengaju *
              </label>
              <DnaSelect
                value={formData.level}
                onChange={(value) => setFormData({ ...formData, level: value as any })}
                options={[
                  { label: "Staff (Head -> Accounting -> Direktur)", value: "STAFF" },
                  { label: "Head Divisi (Accounting -> Direktur)", value: "HEAD_DIVISI" },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Departemen Pemohon *
              </label>
              <DnaSelect
                value={formData.department}
                onChange={(value) => setFormData({ ...formData, department: value })}
                options={[
                  { label: "Produksi Manufaktur", value: "Produksi Manufaktur" },
                  { label: "Gudang & Logistik", value: "Gudang & Logistik" },
                  { label: "R&D Formulasi", value: "R&D Formulasi" },
                  { label: "Quality Control (QC)", value: "Quality Control (QC)" },
                  { label: "Business Development", value: "Business Development" },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap Pemohon *
              </label>
              <DnaInput
                placeholder="Contoh: Ahmad Staff Gudang"
                value={formData.applicant}
                onChange={(e) => setFormData({ ...formData, applicant: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tanggal Dana Dibutuhkan *
              </label>
              <DnaInput
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
              />
            </div>
          </div>
        </DnaCard>

        {/* Right Column: Keperluan & Nominal */}
        <DnaCard className="p-5 space-y-4 border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              2. Nominal & Rincian Penggunaan Dana
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nominal yang Diajukan (Rp) *
            </label>
            <DnaInput
              type="number"
              min="1"
              placeholder="Contoh: 7500000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tujuan & Keperluan Rinci *
            </label>
            <DnaInput
              placeholder="Jelaskan kebutuhan pengadaan sparepart mesin / transport pengiriman..."
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Lampiran Bukti / Invoice Penawaran
            </label>
            <div className="flex items-center gap-2 border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Klik untuk upload file PDF penawaran vendor / kwitansi pendukung...</span>
            </div>
          </div>
        </DnaCard>
      </div>

      {/* Bottom Summary Card */}
      <DnaCard className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500">
              Ringkasan Pengajuan & Otorisasi
            </span>
            <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Pemohon</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formData.applicant || "-"} ({formData.department})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tingkat Alur Approval</span>
                <span className="font-bold text-slate-900 text-sm">
                  {formData.level === "STAFF" ? "3-Tier (Head -> Finance -> Direktur)" : "2-Tier (Finance -> Direktur)"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Total Dana Diajukan</span>
                <span className="font-extrabold text-blue-600 text-xl tabular-nums">
                  {formatRupiah(numericAmount)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end pt-2 sm:pt-0">
            <DnaButton
              variant="outline"
              size="md"
              onClick={onClose}
            >
              Batal
            </DnaButton>
            <DnaButton
              variant="primary"
              size="md"
              icon={<CheckCircle2 className="w-4 h-4" />}
              onClick={onSubmit}
              disabled={numericAmount <= 0 || !formData.applicant || !formData.purpose}
            >
              Ajukan Sekarang
            </DnaButton>
          </div>
        </div>
      </DnaCard>
    </div>
  );
}
