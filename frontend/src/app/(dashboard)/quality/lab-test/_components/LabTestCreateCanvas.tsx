"use client";

import React from "react";
import {
  ArrowLeft,
  FlaskConical,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
} from "lucide-react";
import { DnaButton, DnaBadge } from "@/components/dna";
import type { LabTestFormData, FormulaItem } from "../_types/lab-test.types";

interface LabTestCreateCanvasProps {
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  form: LabTestFormData;
  setForm: React.Dispatch<React.SetStateAction<LabTestFormData>>;
  formulas: FormulaItem[];
}

export function LabTestCreateCanvas({
  onBack,
  onSubmit,
  isSubmitting,
  form,
  setForm,
  formulas,
}: LabTestCreateCanvasProps) {
  // Evaluasi kelolosan parameter fisika & mikrobiologi
  const phNum = parseFloat(form.actualPh) || 0;
  const viscNum = parseFloat(form.actualViscosity) || 0;
  const isPhOk = phNum >= 4.5 && phNum <= 7.0;
  const isViscOk = viscNum >= 2000 && viscNum <= 10000;
  const isStabilityOk =
    form.stability40C === "STABLE" &&
    form.stabilityRT === "STABLE" &&
    form.stability4C === "STABLE";

  const isOverallPass = isPhOk && isViscOk && isStabilityOk && form.status === "PASS";

  const handleSelectFormula = (formulaId: string) => {
    const selected = formulas.find((f) => f.id === formulaId);
    setForm((prev) => ({
      ...prev,
      formulaId,
      productName: selected?.name || selected?.productName || prev.productName,
      batchNumber: selected?.formulaCode ? `BATCH-${selected.formulaCode}-01` : prev.batchNumber,
    }));
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER WITH AUTO-NUMBER BADGE & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Pencatatan Hasil Uji Laboratorium QC & Mutu
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                🏷️ Auto-Number: LAB-AUTO
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Evaluasi parameter fisikokimia (pH, viskositas, densitas), mikrobiologi, organoleptik, dan stabilitas 3 suhu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <DnaButton variant="secondary" size="md" onClick={onBack}>
            Batal
          </DnaButton>
          <DnaButton
            variant="primary"
            size="md"
            icon={<Save className="w-4 h-4" />}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Hasil Uji Lab"}
          </DnaButton>
        </div>
      </div>

      {/* 2-COLUMN IN-PLACE CANVAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* CARD 1: FORMULA & PARAMETER FISIKOKIMIA */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-zinc-900" />
              <span>1. Identitas Formula & Parameter Fisikokimia</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 1 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Formula Selector */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Pilih Formula R&D Terkait <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.formulaId}
                onChange={(e) => handleSelectFormula(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-semibold text-zinc-800"
              >
                <option value="">— Pilih Formula R&D —</option>
                {formulas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.formulaCode || f.id.slice(0, 8)} • {f.name || f.productName || "Formula Kosmetik"}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Produk & No. Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">
                  Nama Produk / Sample <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.productName || ""}
                  onChange={(e) => setForm({ ...form, productName: e.target.value })}
                  placeholder="Contoh: Gentle Cleansing Gel"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white font-bold text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nomor Batch Trial
                </label>
                <input
                  type="text"
                  value={form.batchNumber || ""}
                  onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  placeholder="Contoh: BATCH-2026-09-001"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Fisikokimia Grid */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
              <span className="font-bold text-slate-800 block">Parameter Fisikokimia Kritis</span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    pH Aktual (25°C)
                  </label>
                  <input
                    type="text"
                    value={form.actualPh}
                    onChange={(e) => setForm({ ...form, actualPh: e.target.value })}
                    placeholder="5.50"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className={`text-[10px] mt-0.5 block font-bold ${isPhOk ? "text-emerald-600" : "text-amber-600"}`}>
                    {isPhOk ? "✓ Standar (4.5-7.0)" : "⚠ Di luar standar"}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Viskositas (cps)
                  </label>
                  <input
                    type="text"
                    value={form.actualViscosity}
                    onChange={(e) => setForm({ ...form, actualViscosity: e.target.value })}
                    placeholder="4200"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <span className={`text-[10px] mt-0.5 block font-bold ${isViscOk ? "text-emerald-600" : "text-amber-600"}`}>
                    {isViscOk ? "✓ Standar (2k-10k)" : "⚠ Di luar standar"}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Densitas (g/ml)
                  </label>
                  <input
                    type="text"
                    value={form.actualDensity}
                    onChange={(e) => setForm({ ...form, actualDensity: e.target.value })}
                    placeholder="1.02"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Standard Spec String */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Standar Spesifikasi Produk Acuan
              </label>
              <input
                type="text"
                value={form.standardSpec}
                onChange={(e) => setForm({ ...form, standardSpec: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: ORGANOLEPTIK, STABILITAS & KESIMPULAN MUTU */}
        <div className="p-5 bg-white border border-zinc-200 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 font-bold text-zinc-800 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-900" />
              <span>2. Organoleptik, Mikrobiologi & Stabilitas</span>
            </div>
            <span className="text-[11px] font-normal text-zinc-400">Tahap 2 dari 2</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Organoleptic Matrix */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-zinc-700 font-bold mb-1">Warna</label>
                <input
                  type="text"
                  value={form.colorResult}
                  onChange={(e) => setForm({ ...form, colorResult: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">Aroma</label>
                <input
                  type="text"
                  value={form.aromaResult}
                  onChange={(e) => setForm({ ...form, aromaResult: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
              <div>
                <label className="block text-zinc-700 font-bold mb-1">Tekstur</label>
                <input
                  type="text"
                  value={form.textureResult}
                  onChange={(e) => setForm({ ...form, textureResult: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                />
              </div>
            </div>

            {/* Mikrobiologi Result */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Hasil Uji Mikrobiologi (ALT / APM / Patogen)
              </label>
              <input
                type="text"
                value={form.microbiologyResult}
                onChange={(e) => setForm({ ...form, microbiologyResult: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white text-zinc-800 focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 font-medium"
              />
            </div>

            {/* Stabilitas 3 Suhu */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1.5">
                Uji Stabilitas Suhu Dipercepat (3 Kondisi)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "stability40C", label: "Oven 40°C", val: form.stability40C },
                  { key: "stabilityRT", label: "Ruang 25°C", val: form.stabilityRT },
                  { key: "stability4C", label: "Kulkas 4°C", val: form.stability4C },
                ].map((s) => (
                  <div key={s.key} className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1">
                    <span className="block text-[11px] font-bold text-zinc-700">{s.label}</span>
                    <select
                      value={s.val}
                      onChange={(e) =>
                        setForm({ ...form, [s.key]: e.target.value as any })
                      }
                      className="w-full px-2 py-1 text-[11px] rounded-lg border border-zinc-200 bg-white font-bold text-zinc-800 focus:border-zinc-900"
                    >
                      <option value="STABLE">✓ STABLE (Stabil)</option>
                      <option value="UNSTABLE">✗ UNSTABLE (Pemisahan/Berubah)</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Status Keputusan Akhir */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Status Keputusan Mutu Akhir <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "PASS", label: "✓ LOLOS (PASS)" },
                  { id: "CONDITIONAL", label: "⚠ CONDITIONAL" },
                  { id: "FAIL", label: "✗ REJECT (FAIL)" },
                ].map((st) => (
                  <button
                    type="button"
                    key={st.id}
                    onClick={() => setForm({ ...form, status: st.id as any })}
                    className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all ${
                      form.status === st.id
                        ? st.id === "PASS"
                          ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                          : st.id === "CONDITIONAL"
                          ? "bg-amber-700 text-white border-amber-700 shadow-xs"
                          : "bg-rose-700 text-white border-rose-700 shadow-xs"
                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-zinc-700 font-bold mb-1">
                Catatan Analis QC Lab
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Contoh: Seluruh parameter memenuhi kualifikasi mutu CPKB. Sampel siap untuk tahapan registrasi BPOM."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 bg-white focus:outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
              />
            </div>

            {/* Live Summary Footer */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Status Validasi Mutu:</span>
                <span className={`font-bold ${isOverallPass ? "text-emerald-700" : "text-amber-700"}`}>
                  {isOverallPass ? "Memenuhi Seluruh Syarat CPKB" : "Perlu Verifikasi Lanjutan"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-zinc-200 pt-2">
                <span className="font-bold text-zinc-800">Keputusan Sertifikat Analisis (CoA):</span>
                <span className={`font-extrabold text-xs px-2 py-0.5 rounded-md ${
                  form.status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {form.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
