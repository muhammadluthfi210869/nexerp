"use client";

import React, { useState } from "react";
import {
  DnaButton,
  DnaInput,
  DnaSelect,
} from "@/components/dna";
import { X, GraduationCap, Award, FileText } from "lucide-react";
import { AddTrainingPayload, TrainingRecord } from "../_types/training.types";

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: AddTrainingPayload) => void;
  isSubmitting: boolean;
  employees: any[];
  viewingRecord: TrainingRecord | null;
}

const COMMON_TRAININGS = [
  "CPKB & GMP Fasilitas Kosmetik Tingkat Dasar",
  "Sanitasi Ruang Produksi & Personal Hygiene",
  "Keselamatan Kerja (K3) & Penanganan Bahan Kimia",
  "Operasional Mesin Mixing & Homogenizer",
  "Teknik Pengujian Stabilitas & QC Laboratorium",
  "Standar Pergudangan FIFO/FEFO Kosmetik",
  "Onboarding Nilai Perusahaan & Regulasi Internal 3 Hari",
];

export function TrainingModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  employees,
  viewingRecord,
}: TrainingModalProps) {
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [trainingType, setTrainingType] = useState(COMMON_TRAININGS[0]);
  const [customType, setCustomType] = useState("");
  const [hours, setHours] = useState("8");
  const [goal, setGoal] = useState("");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().split("T")[0]);
  const [certificateUrl, setCertificateUrl] = useState("");

  if (!isOpen && !viewingRecord) return null;

  const isViewOnly = !!viewingRecord;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = trainingType === "LAINNYA" ? customType : trainingType;
    if (!employeeId || !finalType || !goal) return;

    onSubmit({
      employeeId,
      trainingType: finalType,
      hours: parseFloat(hours) || 1,
      goal,
      trainingDate,
      certificateUrl: certificateUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              {isViewOnly ? <Award className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isViewOnly ? "Detail Sesi Pelatihan" : "Catat Jam Pelatihan Pegawai"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isViewOnly ? viewingRecord.employeeName : "Input jam training, target kompetensi & sertifikat"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {isViewOnly ? (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pegawai</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{viewingRecord.employeeName}</p>
                <p className="text-xs text-slate-500">{viewingRecord.employeePosition} • {viewingRecord.department}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Durasi Pelatihan</span>
                <p className="text-sm font-bold text-primary mt-0.5">{viewingRecord.hours} Jam Pelatihan</p>
                <p className="text-xs text-slate-500">Tanggal: {new Date(viewingRecord.trainingDate).toLocaleDateString("id-ID")}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Jenis & Topik Pelatihan</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">{viewingRecord.trainingType}</p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400">Target & Goal Kompetensi</span>
              <p className="text-xs text-slate-700 mt-0.5">{viewingRecord.goal}</p>
            </div>

            {viewingRecord.certificateUrl && (
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700">Tersertifikasi</span>
                  <p className="text-xs text-emerald-900 truncate max-w-sm">{viewingRecord.certificateUrl}</p>
                </div>
                <a
                  href={viewingRecord.certificateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700"
                >
                  Buka Sertifikat
                </a>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <DnaButton variant="secondary" onClick={onClose}>
                Tutup
              </DnaButton>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Pilih Pegawai *</label>
              <DnaSelect
                value={employeeId}
                onChange={(val) => setEmployeeId(val)}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} — {emp.roles?.[0]?.roleName || emp.position || "Staff"} ({emp.roles?.[0]?.division || emp.division || "PRODUCTION"})
                  </option>
                ))}
              </DnaSelect>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-700">Jenis Pelatihan *</label>
                <DnaSelect
                  value={trainingType}
                  onChange={(val) => setTrainingType(val)}
                >
                  {COMMON_TRAININGS.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                  <option value="LAINNYA">Lainnya (Ketik Manual)...</option>
                </DnaSelect>
              </div>

              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-slate-700">Durasi (Jam) *</label>
                <DnaInput
                  type="number"
                  min={1}
                  max={120}
                  required
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            </div>

            {trainingType === "LAINNYA" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tuliskan Jenis Pelatihan *</label>
                <DnaInput
                  required
                  placeholder="Misal: Sertifikasi Operator Boiler Tekanan Tinggi"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tanggal Pelaksanaan *</label>
              <DnaInput
                type="date"
                required
                value={trainingDate}
                onChange={(e) => setTrainingDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Goal / Target Kompetensi (Ketik Langsung) *</label>
              <DnaInput
                required
                placeholder="Contoh: Mampu menjalankan SOP mixing batch 500L tanpa supervisi"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Import Sertifikat (Tautan Dokumen / Google Drive / URL)</label>
              <DnaInput
                placeholder="https://drive.google.com/..."
                value={certificateUrl}
                onChange={(e) => setCertificateUrl(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <DnaButton type="button" variant="secondary" onClick={onClose}>
                Batal
              </DnaButton>
              <DnaButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Simpan Jam Pelatihan"}
              </DnaButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
