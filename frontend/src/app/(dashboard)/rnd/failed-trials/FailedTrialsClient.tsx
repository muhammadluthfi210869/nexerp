"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, RefreshCw, AlertTriangle, Lightbulb, Users, Beaker } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaButton } from "@/components/dna";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import { InlineText, InlineTextarea, FloatingQuickSelect, SaveDot, StatusBadge, FieldLabel } from "@/components/rnd/rnd-table-shared";
import { TYPOGRAPHY, CHIP_CLASSES, TABLE_WRAPPER, RND_PICS } from "@/components/rnd/rnd-constants";

type FailedTrialItem = {
  id: string;
  date: string;
  projectFormula: string;
  pic: string;
  problemSymptom: string;
  rootCause: string;
  correctionAttempted: string;
  solution: string;
  finalLearning: string;
  applicableTo: string;
};

const DETAIL_FIELDS: { key: keyof FailedTrialItem; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "pic", label: "PIC" },
  { key: "projectFormula", label: "Project / Formula" },
  { key: "problemSymptom", label: "Problem Symptom" },
  { key: "rootCause", label: "Root Cause" },
  { key: "correctionAttempted", label: "Correction Attempted" },
  { key: "solution", label: "Solution" },
  { key: "finalLearning", label: "Final Learning" },
  { key: "applicableTo", label: "Applicable To" },
];

export default function FailedTrialsClient() {
  const [data, setData] = useState<FailedTrialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);

  const today = () => new Date().toISOString().slice(0, 10);

  const blankForm = {
    date: today(), projectFormula: "", pic: "",
    problemSymptom: "", rootCause: "", correctionAttempted: "",
    solution: "", finalLearning: "", applicableTo: "",
  };
  const [quickForm, setQuickForm] = useState(blankForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rnd/failed-trials");
      setData((res.data || []).map((ft: any) => ({
        id: ft.id, date: ft.date?.slice(0, 10) || "",
        projectFormula: ft.projectFormula || "", pic: ft.pic || "",
        problemSymptom: ft.problemSymptom || "", rootCause: ft.rootCause || "",
        correctionAttempted: ft.correctionAttempted || "",
        solution: ft.solution || "", finalLearning: ft.finalLearning || "",
        applicableTo: ft.applicableTo || "",
      })));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = useCallback(async (id: string, field: string, value: any) => {
    setIsSaving(p => ({ ...p, [id]: true }));
    try { await api.patch("/rnd/failed-trials/" + id, { [field]: value }); } catch {}
    finally { setIsSaving(p => ({ ...p, [id]: false })); }
  }, []);

  const updateField = useCallback((id: string, field: string, value: any) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    saveField(id, field, value);
  }, [saveField]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Hapus entry ini?")) return;
    try { await api.delete("/rnd/failed-trials/" + id); } catch {}
    setData(prev => prev.filter(d => d.id !== id));
    if (expandedRow === id) setExpandedRow(null);
  }, [expandedRow]);

  const handleQuickAdd = useCallback(async () => {
    try {
      const payload: any = { ...quickForm };
      Object.keys(payload).forEach(k => { if (!payload[k]) payload[k] = undefined; });
      await api.post("/rnd/failed-trials", payload);
      await fetchData();
    } catch {
      setData(prev => [{ id: "NEW-" + Date.now(), ...quickForm }, ...prev]);
    }
    setShowQuickAdd(false);
    setQuickForm(blankForm);
  }, [quickForm, fetchData, blankForm]);

  const picList = useMemo(() => {
    const seen = new Set<string>();
    return data.filter(d => { const k = d.pic.toLowerCase(); if (d.pic && !seen.has(k)) { seen.add(k); return true; } return false; }).map(d => d.pic).slice().sort();
  }, [data]);

  const filteredData = useMemo(() => {
    let s = [...data];
    if (selectedPic) s = s.filter(d => d.pic.toLowerCase() === selectedPic.toLowerCase());
    return s.slice().sort((a, b) => b.date.localeCompare(a.date));
  }, [data, selectedPic]);

  const totalLearning = data.filter(d => d.finalLearning).length;
  const totalSolved = data.filter(d => d.solution).length;

  if (loading)
    return (
      <DashboardShell title="R&D" titleAccent="Failed Trial Learning" subtitle="Loading...">
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      </DashboardShell>
    );

  return (
    <DashboardShell title="R&D" titleAccent="Failed Trial Learning"
      subtitle="Knowledge base — dokumentasi trial gagal dan pembelajaran"
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<RefreshCw />} onClick={fetchData}>Refresh</DnaButton>
          <DnaButton variant="primary" icon={<Plus />} onClick={() => { setQuickForm(blankForm); setShowQuickAdd(true); }}>New Entry</DnaButton>
        </div>
      }>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Failed Trials" value={data.length} subValue="All entries" icon={<AlertTriangle />} className="border-rose-200" />
        <StatCard label="With Solution" value={totalSolved} subValue={data.length ? Math.round((totalSolved / data.length) * 100) + "%" : "0%"} icon={<Beaker />} />
        <StatCard label="With Learning" value={totalLearning} subValue={data.length ? Math.round((totalLearning / data.length) * 100) + "%" : "0%"} icon={<Lightbulb />} />
        <StatCard label="PICs" value={picList.length} subValue="Contributors" icon={<Users />} />
      </div>

      {/* PIC filter */}
      {picList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={TYPOGRAPHY.statLabel + " self-center mr-1"}>PIC:</span>
          <button onClick={() => setSelectedPic(null)}
            className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", !selectedPic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
            All ({data.length})
          </button>
          {picList.map(pic => (
            <button key={pic} onClick={() => setSelectedPic(selectedPic === pic ? null : pic)}
              className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase transition", selectedPic === pic ? CHIP_CLASSES.active : CHIP_CLASSES.inactive)}>
              {pic} ({data.filter(d => d.pic.toLowerCase() === pic.toLowerCase()).length})
            </button>
          ))}
        </div>
      )}

      {/* ── QUICK ADD SECTION ── */}
      {showQuickAdd && (
        <div className="mb-4 rounded-[24px] border-2 border-dashed border-rose-200 bg-rose-50/60 p-4">
          <p className={TYPOGRAPHY.statLabel + " mb-3 flex items-center gap-2"}>
            <Plus size={12} /> New Entry
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Date</p>
              <input type="date" value={quickForm.date} onChange={e => setQuickForm(p => ({ ...p, date: e.target.value }))}
                className="h-8 rounded-lg border border-rose-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">PIC</p>
              <select value={quickForm.pic} onChange={e => setQuickForm(p => ({ ...p, pic: e.target.value }))}
                className="h-8 rounded-lg border border-rose-200 bg-white px-3 text-[12px] font-semibold outline-none">
                <option value="">PIC...</option>
                {[...new Set([...RND_PICS, ...picList])].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="min-w-[200px] flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Project / Formula</p>
              <input value={quickForm.projectFormula} onChange={e => setQuickForm(p => ({ ...p, projectFormula: e.target.value }))} placeholder="Nama project..."
                className="h-8 w-full rounded-lg border border-rose-200 bg-white px-3 text-[12px] font-semibold outline-none" />
            </div>
            <div className="flex gap-2 items-end ml-auto">
              <button onClick={handleQuickAdd}
                className="h-8 px-4 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700 transition">Simpan</button>
              <button onClick={() => { setShowQuickAdd(false); setQuickForm(blankForm); }}
                className="h-8 px-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">Batal</button>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Problem, root cause, solution → klik langsung di tabel setelah tersimpan</p>
        </div>
      )}

      {/* TABLE */}
      <div className={TABLE_WRAPPER}>
        {filteredData.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className={TYPOGRAPHY.statLabel}>No entries yet</p>
            <button onClick={() => setShowQuickAdd(true)} className="mt-2 text-[10px] font-bold text-blue-600 hover:underline">+ Tambah Entry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <colgroup>
                <col className="w-6" />
                <col className="w-20" />
                <col className="w-16" />
                <col className="w-[200px]" />
                <col className="w-[200px]" />
                <col className="w-[160px]" />
                <col className="w-[160px]" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>#</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Date</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>PIC</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Project / Formula</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Problem Symptom</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Root Cause</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-24"}></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const saving = isSaving[item.id];
                  const isExpanded = expandedRow === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cn("border-b border-slate-50 transition-colors group hover:bg-slate-50/50 cursor-pointer", isExpanded && "bg-rose-50/20")}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-mono font-bold text-slate-400">{idx + 1}</span></td>
                        <td className="px-3 py-2.5">
                          <span className="text-[12px] font-semibold text-slate-600">{item.date ? new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                        </td>
                        <td className="px-3 py-2.5"><span className="text-[12px] font-bold text-slate-700">{item.pic}</span></td>
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <InlineText value={item.projectFormula} placeholder="Klik edit..." onSave={v => updateField(item.id, "projectFormula", v)} bold />
                        </td>
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <InlineText value={item.problemSymptom} placeholder="Klik edit..." onSave={v => updateField(item.id, "problemSymptom", v)} />
                        </td>
                        <td className="px-3 py-2.5 max-w-[160px]">
                          <InlineText value={item.rootCause} placeholder="—" onSave={v => updateField(item.id, "rootCause", v)} />
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <SaveDot active={saving} />
                            <button onClick={() => setExpandedRow(isExpanded ? null : item.id)}
                              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 transition">
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <button onClick={() => handleDelete(item.id)}
                              className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* EXPANDED ROW */}
                      {isExpanded && (
                        <tr className="bg-rose-50/30 border-b border-rose-100">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                              {DETAIL_FIELDS.map(f => {
                                const val = item[f.key];
                                if (!val && (f.key === "rootCause" || f.key === "correctionAttempted" || f.key === "applicableTo")) return null;
                                return (
                                  <div key={f.key} className={cn(f.key === "finalLearning" ? "md:col-span-2 lg:col-span-3" : "", f.key === "solution" ? "md:col-span-2" : "")}>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{f.label}</p>
                                    <p className={cn(
                                      "text-[12px] font-semibold",
                                      f.key === "finalLearning" ? "bg-amber-50 border border-amber-100 rounded-md px-3 py-2 text-amber-800" : "text-slate-800",
                                      !val ? "text-slate-300 italic" : ""
                                    )}>
                                      {val || "—"}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Inline edit area */}
                            <div className="mt-4 pt-3 border-t border-rose-100 flex flex-wrap gap-3">
                              <div className="flex-1 min-w-[200px]">
                                <FieldLabel>Correction Attempted</FieldLabel>
                                <InlineText value={item.correctionAttempted} placeholder="Klik untuk isi..." onSave={v => updateField(item.id, "correctionAttempted", v)} />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <FieldLabel>Solution</FieldLabel>
                                <InlineText value={item.solution} placeholder="Klik untuk isi..." onSave={v => updateField(item.id, "solution", v)} />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <FieldLabel>Final Learning</FieldLabel>
                                <InlineTextarea value={item.finalLearning} placeholder="Klik untuk isi pembelajaran..." onSave={v => updateField(item.id, "finalLearning", v)} />
                              </div>
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
    </DashboardShell>
  );
}
