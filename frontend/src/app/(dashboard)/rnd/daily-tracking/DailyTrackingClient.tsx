"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Clock, CheckCircle2, AlertTriangle, Target, ClipboardList, User2, FileText, ChevronDown, ChevronUp, Search, Pencil, X, Save, FlaskConical } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaButton, PageSection, DashboardCard } from "@/components/dna";
import { api } from "@/lib/api";
import { ALL_DAILY_TRACKING } from "@/lib/rnd-mock-data";
import { cn } from "@/lib/utils";

// SHARED RND COMPONENTS
import { InlineText, InlineSelect, InlineNumber, InlineProgress, StatusBadge, SaveDot, FloatingQuickSelect } from "@/components/rnd/rnd-table-shared";
import { FloatingEditModal, FieldConfig } from "@/components/rnd/rnd-edit-modal";
import { ConfirmModal, toast } from "@/components/rnd/rnd-modal";
import { DT_STATUSES, DT_CATEGORIES, DT_PROGRESS_STEPS, BUSDEV_OPTIONS, TYPOGRAPHY, CHIP_CLASSES, TABLE_WRAPPER, STATUS_STYLES, PROGRESS_COLORS, RND_PICS } from "@/components/rnd/rnd-constants";

const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const DAY = 86400000;

const calcDays = (item: any) => {
  if (item.tanggalDone) {
    return Math.max(0, Math.ceil((new Date(item.tanggalDone).getTime() - new Date(item.tanggalMasuk).getTime()) / DAY));
  }
  return Math.max(1, Math.ceil((today().getTime() - new Date(item.tanggalMasuk).getTime()) / DAY));
};

const STATUS_INDICATOR: Record<string, string> = {
  Done: "text-emerald-500",
  "On Progress": "text-blue-500",
  Pending: "text-amber-500",
  "Failed Trial": "text-rose-500",
  "Waiting Material": "text-purple-500",
  "Waiting Approval": "text-indigo-500",
  Cancelled: "text-slate-400",
};

// ═══════════════════════════════════════════════════════════════
// FAILED TRIAL LEARNING TAB — API Fetching
// ═══════════════════════════════════════════════════════════════
type FailedTrialItem = {
  id: string; date: string; projectFormula: string; pic: string;
  problemSymptom: string; rootCause: string; correctionAttempted: string;
  solution: string; finalLearning: string; applicableTo: string;
};

function FailedTrialTab() {
  const [data, setData] = useState<FailedTrialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<{ open: boolean; item: FailedTrialItem | null }>({ open: false, item: null });
  const [formDraft, setFormDraft] = useState({
    date: "", projectFormula: "", pic: "", problemSymptom: "",
    rootCause: "", correctionAttempted: "", solution: "", finalLearning: "", applicableTo: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/rnd/failed-trials");
      setData((res.data || []).map((ft: any) => ({
        id: ft.id,
        date: ft.date?.slice(0, 10) || "",
        projectFormula: ft.projectFormula || "",
        pic: ft.pic || "",
        problemSymptom: ft.problemSymptom || "",
        rootCause: ft.rootCause || "",
        correctionAttempted: ft.correctionAttempted || "",
        solution: ft.solution || "",
        finalLearning: ft.finalLearning || "",
        applicableTo: ft.applicableTo || "",
      })));
    } catch {
      setData([
        { id:"FT-1", date:"2026-07-06", projectFormula:"Fionna - Body lotion brightening with UV filter", pic:"Panca", problemSymptom:"Emulsi pecah setelah 24 jam", rootCause:"Perbandingan oil-water phase tidak sesuai untuk UV filter", correctionAttempted:"Rebatch dengan HLB adjustment", solution:"Gunakan emulsifier HLB 11 dan homogenisasi 8000rpm", finalLearning:"UV filter butuh emulsifier HLB lebih tinggi dari standar lotion", applicableTo:"Semua formula dengan UV filter kimia" },
        { id:"FT-2", date:"2026-07-06", projectFormula:"Fionna - Body lotion brighterning", pic:"Panca", problemSymptom:"Terjadi perubahan warna (yellowing) setelah 2 hari", rootCause:"Interaksi antara arbutin dan xanthan gum pada pH 4.5", correctionAttempted:"Ganti xanthan gum dengan HEC", solution:"Naikkan pH ke 5.0 dan ganti thickener", finalLearning:"Arbutin tidak stabil dengan xanthan gum di pH rendah", applicableTo:"Formula brightening dengan arbutin" },
        { id:"FT-3", date:"2026-07-11", projectFormula:"Amira - Sunscreen SPF 45 Tone up", pic:"Amira", problemSymptom:"SPF hanya mencapai 28 dari target 45", rootCause:"Distribusi UV filter tidak merata karena viskositas terlalu tinggi", correctionAttempted:"Turunkan viskositas dan tambahkan dispersing agent", solution:"Pre-disperse UV filters sebelum ditambahkan ke fasa minyak", finalLearning:"Pre-dispersion UV filter critical untuk efikasi SPF", applicableTo:"Semua formula sunscreen high SPF" },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openEdit = useCallback((item: FailedTrialItem) => {
    setFormDraft({
      date: item.date, projectFormula: item.projectFormula, pic: item.pic,
      problemSymptom: item.problemSymptom, rootCause: item.rootCause,
      correctionAttempted: item.correctionAttempted, solution: item.solution,
      finalLearning: item.finalLearning, applicableTo: item.applicableTo,
    });
    setEditForm({ open: true, item });
  }, []);

  const handleEditSave = useCallback(async () => {
    if (!editForm.item) return;
    try {
      await api.patch(`/rnd/failed-trials/${editForm.item.id}`, {
        date: formDraft.date, projectFormula: formDraft.projectFormula,
        pic: formDraft.pic, problemSymptom: formDraft.problemSymptom,
        rootCause: formDraft.rootCause || undefined,
        correctionAttempted: formDraft.correctionAttempted || undefined,
        solution: formDraft.solution || undefined,
        finalLearning: formDraft.finalLearning || undefined,
        applicableTo: formDraft.applicableTo || undefined,
      });
      setData(prev => prev.map(d => d.id === editForm.item!.id ? { ...d, ...formDraft } : d));
    } catch {}
    setEditForm({ open: false, item: null });
  }, [editForm, formDraft]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Hapus failed trial record ini?")) return;
    try { await api.delete(`/rnd/failed-trials/${id}`); } catch {}
    setData(prev => prev.filter(d => d.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <>
      {/* ── Edit Form ── */}
      {editForm.open && (
        <div className="mb-4 rounded-[24px] border-2 border-dashed border-amber-200 bg-amber-50/60 p-4">
          <p className={TYPOGRAPHY.statLabel + " mb-3 flex items-center gap-2"}>
            <Pencil size={12} /> Edit Failed Trial — {editForm.item?.projectFormula}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Date</p>
              <input type="date" value={formDraft.date} onChange={e => setFormDraft(p => ({ ...p, date: e.target.value }))}
                className="h-8 w-full rounded-lg border border-amber-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">PIC</p>
              <input value={formDraft.pic} onChange={e => setFormDraft(p => ({ ...p, pic: e.target.value }))}
                className="h-8 w-full rounded-lg border border-amber-200 bg-white px-3 text-[12px] font-semibold outline-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Project / Formula</p>
              <input value={formDraft.projectFormula} onChange={e => setFormDraft(p => ({ ...p, projectFormula: e.target.value }))}
                className="h-8 w-full rounded-lg border border-amber-200 bg-white px-3 text-[12px] font-semibold outline-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Problem Symptom</p>
              <textarea value={formDraft.problemSymptom} rows={2} onChange={e => setFormDraft(p => ({ ...p, problemSymptom: e.target.value }))}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none resize-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Root Cause</p>
              <textarea value={formDraft.rootCause} rows={2} onChange={e => setFormDraft(p => ({ ...p, rootCause: e.target.value }))}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none resize-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Correction Attempted</p>
              <textarea value={formDraft.correctionAttempted} rows={2} onChange={e => setFormDraft(p => ({ ...p, correctionAttempted: e.target.value }))}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none resize-none" />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Solution</p>
              <textarea value={formDraft.solution} rows={2} onChange={e => setFormDraft(p => ({ ...p, solution: e.target.value }))}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none resize-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Final Learning</p>
              <textarea value={formDraft.finalLearning} rows={2} onChange={e => setFormDraft(p => ({ ...p, finalLearning: e.target.value }))}
                className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12px] outline-none resize-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Applicable To</p>
              <input value={formDraft.applicableTo} onChange={e => setFormDraft(p => ({ ...p, applicableTo: e.target.value }))}
                className="h-8 w-full rounded-lg border border-amber-200 bg-white px-3 text-[12px] outline-none" />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-3">
            <button onClick={() => setEditForm({ open: false, item: null })}
              className="h-8 px-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">Batal</button>
            <button onClick={handleEditSave}
              className="h-8 px-4 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700 transition">Simpan</button>
          </div>
        </div>
      )}

      <div className={TABLE_WRAPPER}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Search size={14} className="text-slate-400" />
          <span className="text-[10px] font-black uppercase text-slate-400">
            {data.length} Failed Trials — Learning Documentation
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] table-fixed text-left">
            <colgroup>
              <col className="w-24" />
              <col className="w-16" />
              <col className="w-[180px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-[140px]" />
              <col className="w-[130px]" />
              <col className="w-[130px]" />
              <col className="w-16" />
            </colgroup>
            <thead>
              <tr className="border-b border-slate-100">
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Date</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>PIC</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Project / Formula</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Problem Symptom</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Root Cause</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Correction Attempted</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Solution</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Final Learning</th>
                <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((ft) => (
                <tr key={ft.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition group">
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-600">{ft.date}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-[12px] font-bold text-slate-800">{ft.pic}</span>
                  </td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <span className="text-[12px] font-bold text-slate-900 block truncate" title={ft.projectFormula}>{ft.projectFormula}</span>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-medium text-slate-700 truncate" title={ft.problemSymptom}>{ft.problemSymptom}</td>
                  <td className="px-3 py-2.5 text-[11px] font-medium text-slate-700 truncate" title={ft.rootCause}>{ft.rootCause}</td>
                  <td className="px-3 py-2.5 text-[11px] font-medium text-slate-700 truncate" title={ft.correctionAttempted}>{ft.correctionAttempted}</td>
                  <td className="px-3 py-2.5 text-[11px] font-medium text-slate-700 truncate" title={ft.solution}>{ft.solution}</td>
                  <td className="px-3 py-2.5 max-w-[130px]">
                    <div className="rounded-md bg-amber-50 border border-amber-100 px-2 py-1.5">
                      <span className="text-[11px] font-bold text-amber-800 block truncate" title={ft.finalLearning}>{ft.finalLearning}</span>
                      {ft.applicableTo && <p className="text-[9px] font-semibold text-amber-600 mt-0.5 truncate">{ft.applicableTo}</p>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => openEdit(ft)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
                        title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button type="button" onClick={() => handleDelete(ft.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                        title="Hapus">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// HELPERS — format label dari key
// ═══════════════════════════════════════════════════════════════
const FIELD_LABELS: Record<string, string> = {
  noNpf: "No. SPF", category: "Category", busdev: "Busdev",
  taskHariIni: "Task Hari Ini", targetSampleHariIni: "Target Sample",
  kendala: "Kendala", nextAction: "Next Action",
  deadline: "Deadline", tanggalMasuk: "Tgl Masuk", tanggalDone: "Tgl Done",
};
const DETAIL_FIELDS = ["noNpf", "category", "busdev", "taskHariIni", "targetSampleHariIni", "kendala", "nextAction", "deadline", "tanggalMasuk", "tanggalDone"] as const;

// ── Edit Modal field config ──
const EDIT_FIELDS: FieldConfig[] = [
  { key: "projectName", label: "Project / Sample", type: "text" },
  { key: "pic", label: "PIC", type: "select", options: []  }, // filled dynamically
  { key: "date", label: "Date", type: "date" },
  { key: "noNpf", label: "No. SPF", type: "text" },
  { key: "category", label: "Category", type: "select", options: [...DT_CATEGORIES] },
  { key: "busdev", label: "Busdev", type: "select", options: ["", ...BUSDEV_OPTIONS] },
  { key: "taskHariIni", label: "Task Hari Ini", type: "textarea" },
  { key: "targetSampleHariIni", label: "Target Sample", type: "number", min: 1, max: 999 },
  { key: "status", label: "Status", type: "select", options: [...DT_STATUSES] },
  { key: "progress", label: "Progress", type: "number", min: 0, max: 100 },
  { key: "kendala", label: "Kendala", type: "textarea" },
  { key: "nextAction", label: "Next Action", type: "textarea" },
  { key: "deadline", label: "Deadline", type: "date" },
  { key: "tanggalMasuk", label: "Tgl Masuk", type: "date" },
  { key: "tanggalDone", label: "Tgl Done", type: "date" },
];

// ═══════════════════════════════════════════════════════════════
// FAILED TRIAL FORM MODAL — muncul ketika status diubah ke Failed Trial
// ═══════════════════════════════════════════════════════════════
function FailedTrialFormModal({ open, onClose, task, onSaved }: {
  open: boolean;
  onClose: () => void;
  task: any | null;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    problemSymptom: "", rootCause: "", correctionAttempted: "",
    solution: "", finalLearning: "", applicableTo: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ problemSymptom: "", rootCause: "", correctionAttempted: "", solution: "", finalLearning: "", applicableTo: "" });
      setError("");
    }
  }, [open]);

  const handleSave = async () => {
    if (!form.problemSymptom.trim()) {
      setError("Problem Symptom wajib diisi");
      return;
    }
    if (!task) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/rnd/failed-trials", {
        date: task.date || new Date().toISOString().slice(0, 10),
        projectFormula: task.projectSample || task.projectName || "Unknown",
        pic: task.pic || "",
        problemSymptom: form.problemSymptom,
        rootCause: form.rootCause || undefined,
        correctionAttempted: form.correctionAttempted || undefined,
        solution: form.solution || undefined,
        finalLearning: form.finalLearning || undefined,
        applicableTo: form.applicableTo || undefined,
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Gagal menyimpan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || !task) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2">
            <FlaskConical size={16} className="text-rose-500" />
            <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-900">Dokumentasi Failed Trial</h2>
          </div>
          <button type="button" onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        {/* Task info */}
        <div className="px-5 pt-3 pb-1">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Project / Sample</p>
            <p className="text-[13px] font-bold text-slate-900">{task.projectSample || task.projectName || "—"}</p>
            <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
              <span>PIC: {task.pic || "—"}</span>
              <span>Date: {task.date ? new Date(task.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="px-5 py-3 space-y-4">
          {/* Problem Symptom */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              Problem Symptom <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={form.problemSymptom}
              onChange={e => setForm(p => ({ ...p, problemSymptom: e.target.value }))}
              placeholder="Apa yang terjadi? (mis: emulsi pecah, perubahan warna, SPF tidak mencapai target)"
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none"
            />
          </div>

          {/* Root Cause */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Root Cause</label>
            <textarea
              value={form.rootCause}
              onChange={e => setForm(p => ({ ...p, rootCause: e.target.value }))}
              placeholder="Penyebab setelah dianalisis (mis: perbandingan oil-water phase tidak sesuai)"
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none"
            />
          </div>

          {/* Correction Attempted */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Correction Attempted</label>
            <textarea
              value={form.correctionAttempted}
              onChange={e => setForm(p => ({ ...p, correctionAttempted: e.target.value }))}
              placeholder="Apa yang sudah dicoba untuk memperbaiki?"
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none"
            />
          </div>

          {/* Solution */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Solution</label>
            <textarea
              value={form.solution}
              onChange={e => setForm(p => ({ ...p, solution: e.target.value }))}
              placeholder="Solusi yang berhasil ditemukan"
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none"
            />
          </div>

          {/* Final Learning */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Final Learning</label>
            <textarea
              value={form.finalLearning}
              onChange={e => setForm(p => ({ ...p, finalLearning: e.target.value }))}
              placeholder="Kesimpulan knowledge yang bisa dibagikan"
              rows={2}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition resize-none"
            />
          </div>

          {/* Applicable To */}
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Applicable To</label>
            <input
              type="text"
              value={form.applicableTo}
              onChange={e => setForm(p => ({ ...p, applicableTo: e.target.value }))}
              placeholder="Formula/kategori produk lain yang relevan"
              className="mt-1 w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-900 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2.5">
              <p className="text-[11px] font-bold text-rose-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-4 flex items-center justify-between rounded-b-2xl">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-500 hover:bg-slate-50 transition">
            Batal
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-5 py-2 rounded-xl bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition flex items-center gap-1.5 disabled:opacity-50">
            {saving ? (
              <><div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" /> Menyimpan...</>
            ) : (
              <><Save size={14} /> Simpan Failed Trial</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DailyTrackingClient() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Expanded row: simpan ID dari row yang sedang diperluas
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Quick-select dropdown (positioned near button)
  const [quickStatus, setQuickStatus] = useState<{ id: string; value: string; rect?: DOMRect } | null>(null);
  const [quickProgress, setQuickProgress] = useState<{ id: string; value: number; rect?: DOMRect } | null>(null);

  // Edit Modal (floating right drawer for create/edit)
  const [editModal, setEditModal] = useState<{ open: boolean; data: any; mode: "create" | "edit" }>({
    open: false, data: null, mode: "create"
  });

  // Failed Trial form modal — muncul ketika user pilih status "Failed Trial"
  const [failedTrialTask, setFailedTrialTask] = useState<any | null>(null);

  // Loading state for create operation (prevent double submit)
  const [isCreating, setIsCreating] = useState(false);

  // Confirm delete modal
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const [tab, setTab] = useState<"daily" | "failed-trial">("daily");

  const [currentUser, setCurrentUser] = useState<any>({});
  useEffect(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); setCurrentUser(u); } catch {} }, []);

  const isHead = currentUser.id
    ? (currentUser.roles?.includes?.("SUPER_ADMIN") || currentUser.email?.toLowerCase() === "amira@nexerp.id")
    : false;
  const staffPicName = currentUser.fullName || "";

  // ── Normalize PIC names (trim, dedup case-insensitive) ──
  const normalizePic = (name: string) => name.trim();
  const picKey = (name: string) => normalizePic(name).toLowerCase();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rnd/daily-tasks");
      setData((res.data || []).map((t: any, i: number) => ({
        id: t.id, no: i + 1,
        date: t.date?.slice(0, 10) || today().toISOString().slice(0, 10),
        pic: normalizePic(t.pic || ""), noNpf: t.noNpf || "",
        projectSample: t.projectName || "",
        category: t.category || "New Sample", busdev: t.busdev || "",
        taskHariIni: t.task || "", targetSampleHariIni: t.targetSampleCount || 1,
        status: t.status || "On Progress", progress: t.progress || 0,
        kendala: t.kendala || "", nextAction: t.nextAction || "",
        deadline: t.deadline?.slice(0, 10) || "",
        tanggalMasuk: t.tanggalMasuk?.slice(0, 10) || today().toISOString().slice(0, 10),
        tanggalDone: t.tanggalDone?.slice(0, 10) || "",
      })));
    } catch { console.warn("API offline, using mock"); setData(ALL_DAILY_TRACKING); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = useCallback(async (id: string, field: string, value: any) => {
    setIsSaving(p => ({ ...p, [id]: true }));
    try {
      const fm: Record<string, string> = { projectSample: "projectName", taskHariIni: "task", targetSampleHariIni: "targetSampleCount" };
      await api.patch("/rnd/daily-tasks/" + id, { [fm[field] || field]: value });
    } catch (err) {
      console.error(`Failed to save field ${field} for task ${id}:`, err);
    }
    finally { setIsSaving(p => ({ ...p, [id]: false })); }
  }, []);

  const updateField = useCallback((id: string, field: string, value: any) => {
    setData(prev => prev.map(d => {
      if (d.id !== id) return d;
      const updated = { ...d, [field]: value };
      // Auto-set tanggalDone when progress reaches 100%
      if (field === "progress" && value >= 100 && !updated.tanggalDone) {
        updated.tanggalDone = today().toISOString().slice(0, 10);
        updated.status = "Done";
        // Also save the auto-set fields
        saveField(id, "tanggalDone", updated.tanggalDone);
        saveField(id, "status", "Done");
      }
      return updated;
    }));
    saveField(id, field, value);
  }, [saveField]);

  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(true);
    try {
      await api.delete("/rnd/daily-tasks/" + id);
      setData(prev => prev.filter(d => d.id !== id));
      if (expandedRow === id) setExpandedRow(null);
      toast("success", "Task berhasil dihapus");
    } catch (err) {
      console.error(`Failed to delete task ${id}:`, err);
      toast("error", "Gagal menghapus task. Silakan coba lagi.");
    } finally {
      setIsDeleting(false);
      setConfirmDelete({ open: false, id: null });
    }
  }, [expandedRow]);

  const openCreateModal = useCallback(() => {
    setEditModal({
      open: true,
      data: {
        projectName: "", pic: isHead ? "" : staffPicName, date: today().toISOString().slice(0, 10),
        noNpf: "", category: "New Sample", busdev: "", taskHariIni: "", targetSampleHariIni: 1,
        status: "On Progress", progress: 0, kendala: "", nextAction: "",
        deadline: "", tanggalMasuk: today().toISOString().slice(0, 10), tanggalDone: "",
      },
      mode: "create"
    });
  }, [isHead, staffPicName]);

  const openEditModal = useCallback((item: any) => {
    setEditModal({ open: true, data: { ...item }, mode: "edit" });
  }, []);

  const handleEditModalSave = useCallback(async (key: string, value: any) => {
    const { mode, data: modalData } = editModal;
    if (!modalData) return;

    // Map frontend keys to API keys
    const fm: Record<string, string> = {
      projectSample: "projectName", projectName: "projectName",
      taskHariIni: "task", targetSampleHariIni: "targetSampleCount",
    };
    const apiField = fm[key] || key;

    if (mode === "create") {
      // For create mode, we save all fields at once on first save
      if (key === "projectName" || key === "pic") {
        // Don't save yet, wait for user to click "Selesai"
        setEditModal(prev => ({
          ...prev,
          data: { ...prev.data, [key]: value }
        }));
        return;
      }
      setEditModal(prev => ({
        ...prev,
        data: { ...prev.data, [key]: value }
      }));
    } else {
      // Edit mode — save immediately
      if (!modalData.id) return;
      setIsSaving(p => ({ ...p, [modalData.id]: true }));
      try {
        await api.patch("/rnd/daily-tasks/" + modalData.id, { [apiField]: value });
      } catch (err) {
        console.error(`Failed to update field ${key} for task ${modalData.id}:`, err);
      }
      finally { setIsSaving(p => ({ ...p, [modalData.id]: false })); }
      setData(prev => prev.map(d => d.id === modalData.id ? { ...d, [key]: value } : d));
    }
  }, [editModal]);

  const handleEditModalClose = useCallback(async () => {
    const { mode, data: modalData } = editModal;
    if (mode === "create") {
      // Always attempt create (projectName may not be committed if user clicks Selesai without blur)
      setIsCreating(true);
      try {
        await api.post("/rnd/daily-tasks", {
          date: modalData?.date || today().toISOString().slice(0, 10),
          pic: modalData?.pic || (isHead ? "" : staffPicName),
          noNpf: modalData?.noNpf || undefined,
          projectName: modalData?.projectName || "New Task",
          category: modalData?.category || "New Sample",
          busdev: modalData?.busdev || undefined,
          task: modalData?.taskHariIni || undefined,
          targetSampleCount: modalData?.targetSampleHariIni || 1,
          status: modalData?.status || "On Progress",
          progress: modalData?.progress || 0,
          kendala: modalData?.kendala || undefined,
          nextAction: modalData?.nextAction || undefined,
          deadline: modalData?.deadline || undefined,
          tanggalMasuk: modalData?.tanggalMasuk || today().toISOString().slice(0, 10),
          tanggalDone: modalData?.tanggalDone || undefined,
        });
        await fetchData();
        toast("success", "Task berhasil dibuat");
      } catch (err) {
        console.error("Failed to create daily task:", err);
        toast("error", "Gagal menyimpan task. Silakan coba lagi.");
      } finally {
        setIsCreating(false);
      }
    }
    setEditModal({ open: false, data: null, mode: "create" });
  }, [editModal, isHead, staffPicName, fetchData]);

  // ── Unique PICs dari data (normalized, case-insensitive dedup) ──
  const picList = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    data.forEach(d => {
      const key = picKey(d.pic);
      if (d.pic && !seen.has(key)) { seen.add(key); result.push(normalizePic(d.pic)); }
    });
    return result.slice().sort((a, b) => a.localeCompare(b));
  }, [data]);

  const effectivePic = isHead ? selectedPic : (staffPicName || null);

  const filteredData = useMemo(() => {
    let s = [...data];
    if (filterStatus) s = s.filter(d => d.status === filterStatus);
    if (isHead && effectivePic) s = s.filter(d => picKey(d.pic) === picKey(effectivePic));
    if (!isHead && staffPicName) s = s.filter(d => picKey(d.pic) === picKey(staffPicName));
    return s.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filterStatus, effectivePic, isHead, staffPicName]);

  const kpiData = useMemo(() => effectivePic ? data.filter(d => picKey(d.pic) === picKey(effectivePic)) : data, [data, effectivePic]);
  const totalDone = kpiData.filter(d => d.status === "Done").length;
  const totalActive = kpiData.filter(d => d.status !== "Done" && d.status !== "Cancelled").length;
  const totalFailed = kpiData.filter(d => d.status === "Failed Trial").length;
  const avgProgress = kpiData.length > 0 ? Math.round(kpiData.reduce((s, d) => s + d.progress, 0) / kpiData.length) : 0;

  const picSummaries = useMemo(() =>
    picList.map(pic => {
      const t = data.filter(d => picKey(d.pic) === picKey(pic));
      const done = t.filter(d => d.status === "Done").length;
      return { pic, total: t.length, done, pct: t.length ? Math.round((done / t.length) * 100) : 0 };
    }), [data, picList]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach(d => { c[d.status] = (c[d.status] || 0) + 1; });
    return c;
  }, [data]);

  if (loading)
    return (
      <DashboardShell title="R&D" titleAccent="Daily Tracking" subtitle="Loading...">
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      </DashboardShell>
    );

  return (
    <DashboardShell title="R&D" titleAccent="Daily Tracking"
      subtitle={isHead ? "Head R&D View — klik PIC untuk filter" : ("My Tasks — " + staffPicName)}
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<FileText />} onClick={fetchData}>Refresh</DnaButton>
          <DnaButton variant="primary" icon={<Plus />} onClick={openCreateModal}>New Task</DnaButton>
        </div>
      }>

      {/* ── Tab Navigation ── */}
      <div className="mb-5 flex gap-1 border-b border-slate-100">
        <button type="button" onClick={() => setTab("daily")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-b-2 -mb-px",
            tab === "daily" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
          <ClipboardList size={14} /> Daily Tracking
        </button>
        <button type="button" onClick={() => setTab("failed-trial")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-b-2 -mb-px",
            tab === "failed-trial" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600")}>
          <AlertTriangle size={14} /> Failed Trial Learning
        </button>
      </div>

      {tab === "daily" && (<>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <StatCard label="Total Tasks" value={kpiData.length} subValue={effectivePic || "All PICs"} icon={<ClipboardList />} />
        <StatCard label="Done" value={totalDone} subValue={(kpiData.length ? Math.round((totalDone / kpiData.length) * 100) : 0) + "%"} icon={<CheckCircle2 />} />
        <StatCard label="Active" value={totalActive} subValue="Berjalan" icon={<Clock />} />
        <StatCard label="Avg Progress" value={avgProgress + "%"} subValue="Rata-rata" icon={<Target />} />
        <StatCard label="Failed Trial" value={totalFailed} subValue="Gagal" icon={<AlertTriangle />} className={totalFailed > 0 ? "border-rose-200" : ""} />
      </div>

      {/* PIC Summary Cards (Head only) */}
      {isHead && (
        <PageSection title={effectivePic ? ("Viewing: " + effectivePic) : "Tim PIC"}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={() => setSelectedPic(null)}
              className={cn("rounded-[24px] border bg-white p-5 text-left transition hover:-translate-y-0.5", !effectivePic ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-100")}>
              <p className={TYPOGRAPHY.tableHeader}>All PICs</p>
              <p className="mt-2 text-[28px] font-black">{data.length}</p>
              <p className="text-[10px] text-slate-500">{data.filter(d => d.status === "Done").length} Done / {data.length ? Math.round((data.filter(d => d.status === "Done").length / data.length) * 100) : 0}%</p>
              <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-blue-500" style={{ width: (data.length ? Math.round((data.filter(d => d.status === "Done").length / data.length) * 100) : 0) + "%" }} /></div>
            </button>
            {picSummaries.map(p => (
              <button key={p.pic} onClick={() => setSelectedPic(effectivePic === p.pic ? null : p.pic)}
                className={cn("rounded-[24px] border bg-white p-5 text-left transition hover:-translate-y-0.5", effectivePic === p.pic ? "border-blue-400 ring-2 ring-blue-200" : "border-slate-100")}>
                <div className="flex items-center justify-between">
                  <p className={TYPOGRAPHY.tableHeader}>{p.pic}</p>
                  <User2 className="w-4 h-4 text-slate-300" />
                </div>
                <p className="mt-2 text-[28px] font-black">{p.total}</p>
                <div className="flex gap-3 text-[10px]">
                  <span className="font-bold text-emerald-600">{p.done} Done</span>
                  <span className="font-bold text-slate-500">{p.pct}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div className={cn("h-2 rounded-full", p.pct >= 80 ? "bg-emerald-500" : p.pct >= 40 ? "bg-blue-500" : "bg-amber-500")} style={{ width: p.pct + "%" }} />
                </div>
              </button>
            ))}
          </div>
        </PageSection>
      )}

      {/* Staff Summary */}
      {!isHead && staffPicName && (
        <PageSection title={"My Performance — " + staffPicName}>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-[24px] border border-slate-100 bg-white p-5">
              <p className={TYPOGRAPHY.statLabel}>Total Saya</p>
              <p className="mt-2 text-[28px] font-black">{data.filter(d => picKey(d.pic) === picKey(staffPicName)).length}</p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-white p-5">
              <p className={TYPOGRAPHY.statLabel}>Done</p>
              <p className="mt-2 text-[28px] font-black text-emerald-600">{data.filter(d => picKey(d.pic) === picKey(staffPicName) && d.status === "Done").length}</p>
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-white p-5">
              <p className={TYPOGRAPHY.statLabel}>Avg Progress</p>
              <p className="mt-2 text-[28px] font-black">{avgProgress}%</p>
            </div>
          </div>
        </PageSection>
      )}

      {/* TABLE — OVERVIEW */}
      <div className={TABLE_WRAPPER + " mb-6"}>
        {/* PIC filter chips — kayak PM: from data, no /rnd/pics API */}
        {isHead && (
          <div className="flex flex-wrap gap-2 px-5 pt-4 pb-2 border-b border-slate-50">
            <span className={TYPOGRAPHY.statLabel + " self-center mr-1"}>PIC:</span>
            <button onClick={() => setSelectedPic(null)}
              className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", !effectivePic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
              All ({data.length})
            </button>
            {picList.map(pic => (
              <button key={pic} onClick={() => setSelectedPic(effectivePic === pic ? null : pic)}
                className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", effectivePic === pic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
                {pic} ({data.filter(d => picKey(d.pic) === picKey(pic)).length})
              </button>
            ))}
          </div>
        )}

        {/* Status filter chips */}
        <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-slate-50">
          <button onClick={() => setFilterStatus(null)}
            className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", !filterStatus ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
            All ({filteredData.length})
          </button>
          {DT_STATUSES.filter(s => statusCounts[s]).map(s => (
            <button key={s} onClick={() => setFilterStatus(s === filterStatus ? null : s)}
              className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", filterStatus === s ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
              {s} ({statusCounts[s]})
            </button>
          ))}
        </div>

        {filteredData.length === 0 ? (
          <div className="px-5 py-10 text-center border border-dashed border-slate-200 bg-slate-50 mx-5 my-4 rounded-[24px]">
            <p className={TYPOGRAPHY.statLabel}>No entries</p>
            <button onClick={openCreateModal} className="mt-2 text-[10px] font-bold text-blue-600 hover:underline">+ Tambah Task</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-6"}>#</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>PIC</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Date</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-24"}>No. SPF</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Project / Sample</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-32"}>Status ⚡</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-20"}>Prog ⚡</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>Days</th>
                  <th className="px-3 py-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(item => {
                  const days = calcDays(item);
                  const saving = isSaving[item.id];
                  const isExpanded = expandedRow === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cn("border-b border-slate-50 transition-colors group hover:bg-slate-50/50 cursor-pointer",
                        item.status === "Done" && "bg-emerald-50/10",
                        isExpanded && "bg-blue-50/20")}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400">{item.no}</span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="flex items-center gap-1.5">
                            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STATUS_INDICATOR[item.status] || "bg-slate-300")} />
                            <span className="text-[12px] font-bold text-slate-700">{item.pic}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <span className="text-[12px] font-semibold text-slate-500">{new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[11px] font-mono font-bold text-slate-600">{item.noNpf || <span className="text-slate-200">—</span>}</span>
                        </td>
                        <td className="px-3 py-2.5 max-w-[220px]">
                          <span className="text-[12px] font-bold text-slate-900 block truncate" title={item.projectSample}>{item.projectSample}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button type="button" onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); e.stopPropagation(); setQuickStatus({ id: item.id, value: item.status, rect: r }); }}
                            className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition hover:ring-2 hover:ring-blue-200 cursor-pointer", STATUS_STYLES[item.status] || "bg-slate-50 border-slate-200 text-slate-600")}>
                            {item.status}
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <button type="button" onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); e.stopPropagation(); setQuickProgress({ id: item.id, value: item.progress, rect: r }); }}
                            className="flex items-center gap-1.5 min-w-[56px] h-7 px-1 rounded-md hover:bg-blue-50 transition cursor-pointer">
                            <div className="w-8 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className={cn("h-1.5 rounded-full transition-all", PROGRESS_COLORS(item.progress))} style={{ width: item.progress + "%" }} />
                            </div>
                            <span className="text-[9px] font-bold tabular-nums text-slate-500">{item.progress}%</span>
                          </button>
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <span className={cn("text-[12px] font-bold tabular-nums", days > 7 ? "text-rose-600" : "text-slate-500")}>{days}d</span>
                            <SaveDot active={saving} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => openEditModal(item)}
                              className="p-1 rounded-md text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                              title="Edit">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition"
                              title="Detail">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button onClick={() => setConfirmDelete({ open: true, id: item.id })}
                              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* ── EXPANDED ROW: semua field detail ── */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30 border-b border-blue-100">
                          <td colSpan={9} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3">
                              {DETAIL_FIELDS.map(field => {
                                const label = FIELD_LABELS[field] || field;
                                const val = item[field];
                                if (!val && field === "taskHariIni") return null;
                                if (!val && field === "kendala") return null;
                                if (!val && field === "nextAction") return null;
                                return (
                                  <div key={field} className="space-y-0.5">
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                                    <p className={cn(
                                      "text-[12px] font-semibold",
                                      field === "kendala" && val ? "text-rose-600" : "",
                                      field === "nextAction" && val ? "text-blue-600" : "",
                                      !val ? "text-slate-300 italic" : "text-slate-800"
                                    )}>
                                      {val || "—"}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Inline edit untuk field tertentu */}
                            <div className="mt-4 pt-3 border-t border-blue-100 flex flex-wrap gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-400">Category:</span>
                                <InlineSelect value={item.category} options={DT_CATEGORIES as any} onSave={v => updateField(item.id, "category", v)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-400">Busdev:</span>
                                <InlineSelect value={item.busdev || ""} options={["", ...BUSDEV_OPTIONS] as any} onSave={v => updateField(item.id, "busdev", v)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black uppercase text-slate-400">Target:</span>
                                <InlineNumber value={item.targetSampleHariIni} min={1} onSave={v => updateField(item.id, "targetSampleHariIni", v)} />
                              </div>
                              <InlineText value={item.noNpf} placeholder="No. SPF" onSave={v => updateField(item.id, "noNpf", v)} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Dropdown: Status ⚡ ── */}
      <FloatingQuickSelect
        open={!!quickStatus}
        onClose={() => setQuickStatus(null)}
        title="Change Status"
        options={DT_STATUSES}
        value={quickStatus?.value || ""}
        onSelect={val => {
          if (quickStatus) {
            if (val === "Failed Trial") {
              // Open modal untuk isi Failed Trial Learning
              const task = data.find(d => d.id === quickStatus.id);
              setFailedTrialTask(task || null);
              setQuickStatus(null);
            } else {
              updateField(quickStatus.id, "status", val);
              if (val === "Revision") {
                setTimeout(() => {
                  router.push("/rnd/project-monitoring");
                }, 500);
              }
            }
          }
        }}
        colorMap={STATUS_STYLES}
        anchorRect={quickStatus?.rect}
      />

      {/* ── Dropdown: Progress ⚡ ── */}
      <FloatingQuickSelect
        open={!!quickProgress}
        onClose={() => setQuickProgress(null)}
        title="Progress"
        options={DT_PROGRESS_STEPS.map(p => String(p) + "%")}
        value={String(quickProgress?.value ?? 0) + "%"}
        onSelect={val => { if (quickProgress) updateField(quickProgress.id, "progress", parseInt(val)); }}
        anchorRect={quickProgress?.rect}
      />

      {/* ── Floating Edit Modal: Create / Edit ── */}
      <FloatingEditModal
        open={editModal.open}
        onClose={handleEditModalClose}
        title={editModal.mode === "create" ? "New Task" : "Edit Task"}
        fields={EDIT_FIELDS.map(f => f.key === "pic" ? { ...f, options: [...new Set([...(RND_PICS as unknown as string[]), ...picList])] } : f)}
        data={editModal.data || {}}
        onSave={handleEditModalSave}
      />

      {/* ── Failed Trial Form Modal ── */}
      <FailedTrialFormModal
        open={!!failedTrialTask}
        onClose={() => setFailedTrialTask(null)}
        task={failedTrialTask}
        onSaved={() => {
          if (failedTrialTask) {
            // Update status di UI dan API
            updateField(failedTrialTask.id, "status", "Failed Trial");
          }
          fetchData();
        }}
      />

      </>)}
      {tab === "failed-trial" && <FailedTrialTab />}

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={confirmDelete.open}
        onClose={() => setConfirmDelete({ open: false, id: null })}
        onConfirm={() => confirmDelete.id ? handleDelete(confirmDelete.id) : {}}
        title="Hapus Task"
        message="Apakah Anda yakin ingin menghapus task ini? Tindakan ini tidak bisa dibatalkan."
        confirmLabel={isDeleting ? "Menghapus..." : "Hapus"}
        variant="danger"
        loading={isDeleting}
      />

      {/* ── Replace alert() dengan toast di handleEditModalClose ── */}
      {/* toast dipanggil langsung di handleEditModalClose */}
    </DashboardShell>
  );
}


