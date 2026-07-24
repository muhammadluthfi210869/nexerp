"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, RefreshCw, Target, Clock, TrendingUp, Award } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaButton, PageSection } from "@/components/dna";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import { InlineText, InlineNumber, FloatingQuickSelect, SaveDot, StatusBadge, FieldLabel } from "@/components/rnd/rnd-table-shared";
import { TYPOGRAPHY, CHIP_CLASSES, TABLE_WRAPPER, RND_PICS } from "@/components/rnd/rnd-constants";

type WPItem = {
  id: string;
  pic: string;
  weekLabel: string;
  weekStart: string;
  weekEnd: string;
  totalTask: number;
  doneCount: number;
  delayedCount: number;
  failedTrial: number;
  revisionCount: number;
  ontimePct: number;
  trialSuccessRate: number;
  initiativeScore: number;
  weeklyScore: number | null;
  notes: string;
};

const FIELD_LABELS: Record<string, string> = {
  totalTask: "Total Task", doneCount: "Done", delayedCount: "Delayed",
  failedTrial: "Failed Trial", revisionCount: "Revisi",
  ontimePct: "On-Time %", trialSuccessRate: "Success Rate",
  initiativeScore: "Initiative", weeklyScore: "Score",
};

export default function WeeklyPerformanceClient() {
  const [data, setData] = useState<WPItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);

  const blankForm = {
    pic: "", weekLabel: "", weekStart: "", weekEnd: "",
    totalTask: 0, doneCount: 0, delayedCount: 0, failedTrial: 0, revisionCount: 0,
    ontimePct: 0, trialSuccessRate: 0, initiativeScore: 0, notes: "",
  };
  const [quickForm, setQuickForm] = useState(blankForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rnd/weekly-performance");
      setData((res.data || []).map((t: any) => ({
        id: t.id, pic: t.pic || "", weekLabel: t.weekLabel || "",
        weekStart: t.weekStart?.slice(0, 10) || "",
        weekEnd: t.weekEnd?.slice(0, 10) || "",
        totalTask: t.totalTask ?? 0, doneCount: t.doneCount ?? 0,
        delayedCount: t.delayedCount ?? 0, failedTrial: t.failedTrial ?? 0,
        revisionCount: t.revisionCount ?? 0,
        ontimePct: t.ontimePct ?? 0, trialSuccessRate: t.trialSuccessRate ?? 0,
        initiativeScore: t.initiativeScore ?? 0,
        weeklyScore: t.weeklyScore ?? null, notes: t.notes || "",
      })));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = useCallback(async (id: string, field: string, value: any) => {
    setIsSaving(p => ({ ...p, [id]: true }));
    try { await api.patch("/rnd/weekly-performance/" + id, { [field]: value }); } catch {}
    finally { setIsSaving(p => ({ ...p, [id]: false })); }
  }, []);

  const updateField = useCallback((id: string, field: string, value: any) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    saveField(id, field, value);
  }, [saveField]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Hapus entry ini?")) return;
    try { await api.delete("/rnd/weekly-performance/" + id); } catch {}
    setData(prev => prev.filter(d => d.id !== id));
    if (expandedRow === id) setExpandedRow(null);
  }, [expandedRow]);

  const handleQuickAdd = useCallback(async () => {
    try {
      await api.post("/rnd/weekly-performance", {
        ...quickForm,
        weekStart: quickForm.weekStart || undefined,
        weekEnd: quickForm.weekEnd || undefined,
        notes: quickForm.notes || undefined,
      });
      await fetchData();
    } catch {
      setData(prev => [{ id: "NEW-" + Date.now(), ...quickForm, weeklyScore: null }, ...prev]);
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
    return s.slice().sort((a, b) => (b.weekStart || "").localeCompare(a.weekStart || ""));
  }, [data, selectedPic]);

  const scoreColor = (score: number | null) => {
    if (score === null || score === undefined) return "text-slate-300";
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-amber-600";
    return "text-rose-600";
  };

  const avgScore = data.length ? Math.round(data.reduce((s, d) => s + (d.weeklyScore ?? d.ontimePct), 0) / data.length) : 0;
  const totalEntries = data.length;
  const totalDoneAll = data.reduce((s, d) => s + d.doneCount, 0);
  const totalTaskAll = data.reduce((s, d) => s + d.totalTask, 0);

  if (loading)
    return (
      <DashboardShell title="R&D" titleAccent="Weekly Performance" subtitle="Loading...">
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      </DashboardShell>
    );

  return (
    <DashboardShell title="R&D" titleAccent="Weekly Performance"
      subtitle="Performance metrics per PIC per minggu"
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<RefreshCw />} onClick={fetchData}>Refresh</DnaButton>
          <DnaButton variant="primary" icon={<Plus />} onClick={() => { setQuickForm(blankForm); setShowQuickAdd(true); }}>New Entry</DnaButton>
        </div>
      }>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Entries" value={totalEntries} subValue="Weekly records" icon={<Target />} />
        <StatCard label="Total Tasks" value={totalTaskAll} subValue="Across all weeks" icon={<Clock />} />
        <StatCard label="Total Done" value={totalDoneAll} subValue={totalTaskAll ? Math.round((totalDoneAll / totalTaskAll) * 100) + "%" : "0%"} icon={<TrendingUp />} />
        <StatCard label="Avg Score" value={avgScore + "%"} subValue="Rata-rata performa" icon={<Award />} />
      </div>

      {/* PIC filter chips */}
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

      {/* ── QUICK ADD SECTION (antara KPI dan TABLE) ── */}
      {showQuickAdd && (
        <div className="mb-4 rounded-[24px] border-2 border-dashed border-blue-200 bg-blue-50/60 p-4">
          <p className={TYPOGRAPHY.statLabel + " mb-3 flex items-center gap-2"}>
            <Plus size={12} /> New Entry
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">PIC</p>
              <select value={quickForm.pic} onChange={e => setQuickForm(p => ({ ...p, pic: e.target.value }))}
                className="h-8 rounded-lg border border-blue-200 bg-white px-3 text-[12px] font-semibold outline-none">
                <option value="">PIC...</option>
                {[...new Set([...RND_PICS, ...picList])].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Week</p>
              <input value={quickForm.weekLabel} onChange={e => setQuickForm(p => ({ ...p, weekLabel: e.target.value }))} placeholder="Minggu 1"
                className="h-8 rounded-lg border border-blue-200 bg-white px-3 text-[12px] font-semibold outline-none w-36" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Start</p>
              <input type="date" value={quickForm.weekStart} onChange={e => setQuickForm(p => ({ ...p, weekStart: e.target.value }))}
                className="h-8 rounded-lg border border-blue-200 bg-white px-3 text-[12px] outline-none w-28" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">End</p>
              <input type="date" value={quickForm.weekEnd} onChange={e => setQuickForm(p => ({ ...p, weekEnd: e.target.value }))}
                className="h-8 rounded-lg border border-blue-200 bg-white px-3 text-[12px] outline-none w-28" />
            </div>
            <div className="flex gap-2 items-end ml-auto">
              <button onClick={handleQuickAdd}
                className="h-8 px-4 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition">Simpan</button>
              <button onClick={() => { setShowQuickAdd(false); setQuickForm(blankForm); }}
                className="h-8 px-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">Batal</button>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Task count, done, delay, score → klik langsung di tabel setelah tersimpan</p>
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
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-6"}>#</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>PIC</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Week</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Task</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Done</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Delay</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Failed</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Revisi</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>On-Time</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>Success</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-12"}>Score</th>
                  <th className="px-3 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const saving = isSaving[item.id];
                  const isExpanded = expandedRow === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cn("border-b border-slate-50 transition-colors group hover:bg-slate-50/50 cursor-pointer", isExpanded && "bg-blue-50/20")}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-mono font-bold text-slate-400">{idx + 1}</span></td>
                        <td className="px-3 py-2.5"><span className="text-[12px] font-bold text-slate-700">{item.pic}</span></td>
                        <td className="px-3 py-2.5 max-w-[160px]">
                          <InlineText value={item.weekLabel} onSave={v => updateField(item.id, "weekLabel", v)} bold />
                          {item.weekStart && <span className="text-[9px] text-slate-400 block">{new Date(item.weekStart).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {item.weekEnd ? new Date(item.weekEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>}
                        </td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.totalTask} min={0} max={999} onSave={v => updateField(item.id, "totalTask", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.doneCount} min={0} max={999} onSave={v => updateField(item.id, "doneCount", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.delayedCount} min={0} max={999} onSave={v => updateField(item.id, "delayedCount", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.failedTrial} min={0} max={999} onSave={v => updateField(item.id, "failedTrial", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.revisionCount} min={0} max={999} onSave={v => updateField(item.id, "revisionCount", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.ontimePct} min={0} max={100} onSave={v => updateField(item.id, "ontimePct", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.trialSuccessRate} min={0} max={100} onSave={v => updateField(item.id, "trialSuccessRate", v)} /></td>
                        <td className="px-3 py-2.5">
                          <span className={cn("text-[14px] font-black tabular-nums", scoreColor(item.weeklyScore))}>{item.weeklyScore ?? item.ontimePct}</span>
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
                        <tr className="bg-blue-50/30 border-b border-blue-100">
                          <td colSpan={12} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
                              {["totalTask", "doneCount", "delayedCount", "failedTrial", "revisionCount", "ontimePct", "trialSuccessRate", "initiativeScore"].map(f => (
                                <div key={f}>
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{FIELD_LABELS[f] || f}</p>
                                  <p className={cn("text-[13px] font-bold", f === "doneCount" ? "text-emerald-600" : f === "failedTrial" ? "text-rose-600" : f === "delayedCount" ? "text-amber-600" : "text-slate-800")}>
                                    {(item as any)[f] ?? 0}
                                    {(f === "ontimePct" || f === "trialSuccessRate") ? "%" : ""}
                                  </p>
                                </div>
                              ))}
                              {item.weeklyScore !== null && item.weeklyScore !== undefined && (
                                <div>
                                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Composite Score</p>
                                  <p className={cn("text-[13px] font-black", scoreColor(item.weeklyScore))}>{item.weeklyScore}</p>
                                </div>
                              )}
                            </div>
                            {/* Notes & Inline Edit */}
                            <div className="mt-4 pt-3 border-t border-blue-100">
                              <div className="flex flex-wrap gap-3 items-start">
                                <div className="w-full">
                                  <FieldLabel>Notes</FieldLabel>
                                  <InlineText value={item.notes} placeholder="Klik untuk isi catatan..." onSave={v => updateField(item.id, "notes", v)} />
                                </div>
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
