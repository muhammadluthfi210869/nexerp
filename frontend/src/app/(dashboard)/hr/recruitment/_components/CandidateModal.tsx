"use client";

import React, { useState } from "react";
import {
  DnaButton,
  DnaInput,
  DnaSelect,
} from "@/components/dna";
import { X, UserPlus, FileText, CheckCircle2 } from "lucide-react";
import { CreateCandidatePayload, CandidateItem } from "../_types/recruitment.types";

interface CandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateCandidatePayload) => void;
  isSubmitting: boolean;
  viewingCandidate: CandidateItem | null;
}

const DEPARTMENTS = [
  "R&D Formulasi",
  "Produksi & Kemas",
  "Quality Control (QC/QA)",
  "Warehouse & Logistik",
  "Commercial / Sales",
  "SCM & Purchasing",
  "Finance & Accounting",
  "HR & General Affair",
];

export function CandidateModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  viewingCandidate,
}: CandidateModalProps) {
  const [form, setForm] = useState<CreateCandidatePayload>({
    name: "",
    department: DEPARTMENTS[0],
    email: "",
    phone: "",
    cvUrl: "",
    cvReviewScore: 80,
    cvReviewNotes: "",
  });

  if (!isOpen && !viewingCandidate) return null;

  const isViewOnly = !!viewingCandidate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
              {isViewOnly ? <FileText className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {isViewOnly ? "Detail & Riwayat Pelamar" : "Tambah Pelamar Baru (ATS)"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isViewOnly ? `Profil kandidat: ${viewingCandidate.name}` : "Input identitas dan tautan CV calon karyawan"}
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
                <span className="text-[10px] uppercase font-bold text-slate-400">Nama Lengkap</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{viewingCandidate.name}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Departemen Target</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{viewingCandidate.department}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Email & Kontak</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{viewingCandidate.email}</p>
                <p className="text-xs text-slate-500">{viewingCandidate.phone || "-"}</p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Tahapan & Status</span>
                <p className="text-xs font-bold text-primary mt-0.5">{viewingCandidate.stage}</p>
                <p className="text-xs text-slate-500">{viewingCandidate.status}</p>
              </div>
            </div>

            {viewingCandidate.cvUrl && (
              <div className="bg-blue-50/50 p-3.5 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600">Dokumen CV</span>
                  <p className="text-xs text-slate-600 truncate max-w-sm">{viewingCandidate.cvUrl}</p>
                </div>
                <a
                  href={viewingCandidate.cvUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  Buka CV
                </a>
              </div>
            )}

            {viewingCandidate.cvReviewNotes && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400">Catatan Review & Wawancara</span>
                <p className="text-xs text-slate-700 mt-1">{viewingCandidate.cvReviewNotes}</p>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nama Pelamar *</label>
                <DnaInput
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Departemen Target *</label>
                <DnaSelect
                  value={form.department}
                  onChange={(val) => setForm({ ...form, department: val })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </DnaSelect>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Pelamar *</label>
                <DnaInput
                  required
                  type="email"
                  placeholder="budi@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nomor WhatsApp / HP</label>
                <DnaInput
                  placeholder="081234567890"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tautan Dokumen CV (Google Drive / PDF Link)</label>
              <DnaInput
                placeholder="https://drive.google.com/..."
                value={form.cvUrl}
                onChange={(e) => setForm({ ...form, cvUrl: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5 col-span-1">
                <label className="text-xs font-bold text-slate-700">Skor Review CV (0-100)</label>
                <DnaInput
                  type="number"
                  min={0}
                  max={100}
                  value={form.cvReviewScore}
                  onChange={(e) => setForm({ ...form, cvReviewScore: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-700">Catatan Singkat Kualifikasi</label>
                <DnaInput
                  placeholder="Pengalaman formulasi kosmetik 2 tahun..."
                  value={form.cvReviewNotes}
                  onChange={(e) => setForm({ ...form, cvReviewNotes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <DnaButton type="button" variant="secondary" onClick={onClose}>
                Batal
              </DnaButton>
              <DnaButton type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Menyimpan..." : "Daftarkan Pelamar"}
              </DnaButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
