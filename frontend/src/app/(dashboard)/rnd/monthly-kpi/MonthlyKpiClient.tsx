"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, RefreshCw, Award, TrendingUp, Target, Star, Users } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaButton, PageSection } from "@/components/dna";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import { InlineText, InlineNumber, InlineSelect, FloatingQuickSelect, SaveDot, StatusBadge, FieldLabel } from "@/components/rnd/rnd-table-shared";
import { TYPOGRAPHY, CHIP_CLASSES, TABLE_WRAPPER, RND_PICS } from "@/components/rnd/rnd-constants";

type KpiItem = {
  id: string;
  month: string;
  pic: string;
  ontimePct: number;
  trialSuccessRate: number;
  revisionRate: number;
  initiativeScore: number;
  knowledgeContribution: number;
  compositeScore: number | null;
  grade: string;
};

const GRADES = ["A", "B", "C", "D", "E"] as const;

const GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700 border-emerald-200",
  B: "bg-blue-50 text-blue-700 border-blue-200",
  C: "bg-amber-50 text-amber-700 border-amber-200",
  D: "bg-orange-50 text-orange-700 border-orange-200",
  E: "bg-rose-50 text-rose-700 border-rose-200",
};

const FIELD_LABELS: Record<string, string> = {
  ontimePct: "On-Time %", trialSuccessRate: "Success Rate",
  revisionRate: "Revision Rate", initiativeScore: "Initiative",
  knowledgeContribution: "Knowledge", compositeScore: "Composite",
};

const DETAIL_FIELDS = ["ontimePct", "trialSuccessRate", "revisionRate", "initiativeScore", "knowledgeContribution", "compositeScore"] as const;

export default function MonthlyKpiClient() {
  const [data, setData] = useState<KpiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [selectedPic, setSelectedPic] = useState<string | null>(null);
  const [quickGrade, setQuickGrade] = useState<{ id: string; value: string; rect?: DOMRect } | null>(null);

  const blankForm = {
    month: "", pic: "", ontimePct: 0, trialSuccessRate: 0, revisionRate: 0,
    initiativeScore: 0, knowledgeContribution: 0, grade: "",
  };
  const [quickForm, setQuickForm] = useState(blankForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rnd/monthly-kpi");
      setData((res.data || []).map((t: any) => ({
        id: t.id, month: t.month || "", pic: t.pic || "",
        ontimePct: t.ontimePct ?? 0, trialSuccessRate: t.trialSuccessRate ?? 0,
        revisionRate: t.revisionRate ?? 0, initiativeScore: t.initiativeScore ?? 0,
        knowledgeContribution: t.knowledgeContribution ?? 0,
        compositeScore: t.compositeScore ?? null, grade: t.grade || "",
      })));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = useCallback(async (id: string, field: string, value: any) => {
    setIsSaving(p => ({ ...p, [id]: true }));
    try { await api.patch("/rnd/monthly-kpi/" + id, { [field]: value }); } catch {}
    finally { setIsSaving(p => ({ ...p, [id]: false })); }
  }, []);

  const updateField = useCallback((id: string, field: string, value: any) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    saveField(id, field, value);
  }, [saveField]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Hapus KPI ini?")) return;
    try { await api.delete("/rnd/monthly-kpi/" + id); } catch {}
    setData(prev => prev.filter(d => d.id !== id));
    if (expandedRow === id) setExpandedRow(null);
  }, [expandedRow]);

  const handleQuickAdd = useCallback(async () => {
    try {
      await api.post("/rnd/monthly-kpi", {
        ...quickForm, month: quickForm.month || undefined,
        grade: quickForm.grade || undefined,
      });
      await fetchData();
    } catch {
      setData(prev => [{ id: "NEW-" + Date.now(), ...quickForm, compositeScore: null }, ...prev]);
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
    return s.slice().sort((a, b) => b.month.localeCompare(a.month) || a.pic.localeCompare(b.pic));
  }, [data, selectedPic]);

  const gradeColor = (grade: string) => {
    switch (grade) {
      case "A": return "text-emerald-600 bg-emerald-50";
      case "B": return "text-blue-600 bg-blue-50";
      case "C": return "text-amber-600 bg-amber-50";
      case "D": return "text-orange-600 bg-orange-50";
      case "E": return "text-rose-600 bg-rose-50";
      default: return "text-slate-400 bg-slate-50";
    }
  };

  const avgComposite = data.length ? Math.round(data.reduce((s, d) => s + (d.compositeScore ?? d.ontimePct), 0) / data.length) : 0;
  const gradeDistribution = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach(d => { if (d.grade) c[d.grade] = (c[d.grade] || 0) + 1; });
    return c;
  }, [data]);

  if (loading)
    return (
      <DashboardShell title="R&D" titleAccent="Monthly KPI" subtitle="Loading...">
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      </DashboardShell>
    );

  return (
    <DashboardShell title="R&D" titleAccent="Monthly KPI"
      subtitle="KPI bulanan — performa PIC per bulan"
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<RefreshCw />} onClick={fetchData}>Refresh</DnaButton>
          <DnaButton variant="primary" icon={<Plus />} onClick={() => { setQuickForm(blankForm); setShowQuickAdd(true); }}>New Entry</DnaButton>
        </div>
      }>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Records" value={data.length} subValue="Across all months" icon={<Target />} />
        <StatCard label="Avg Composite" value={avgComposite + "%"} subValue="Rata-rata skor" icon={<Award />} />
        <StatCard label="PICs" value={picList.length} subValue="Active staff" icon={<Users />} />
        <StatCard label="Grade A" value={gradeDistribution["A"] || 0} subValue="Top performers" icon={<Star />} className={gradeDistribution["A"] ? "border-emerald-200" : ""} />
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
        <div className="mb-4 rounded-[24px] border-2 border-dashed border-emerald-200 bg-emerald-50/60 p-4">
          <p className={TYPOGRAPHY.statLabel + " mb-3 flex items-center gap-2"}>
            <Plus size={12} /> New Entry
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Month</p>
              <input type="month" value={quickForm.month} onChange={e => setQuickForm(p => ({ ...p, month: e.target.value }))}
                className="h-8 rounded-lg border border-emerald-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">PIC</p>
              <select value={quickForm.pic} onChange={e => setQuickForm(p => ({ ...p, pic: e.target.value }))}
                className="h-8 rounded-lg border border-emerald-200 bg-white px-3 text-[12px] font-semibold outline-none">
                <option value="">PIC...</option>
                {[...new Set([...RND_PICS, ...picList])].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">On-Time %</p>
              <input type="number" value={quickForm.ontimePct} onChange={e => setQuickForm(p => ({ ...p, ontimePct: parseInt(e.target.value) || 0 }))}
                className="h-8 w-16 rounded-lg border border-emerald-200 bg-white px-3 text-[12px] font-bold text-center outline-none" />
            </div>
            <div className="flex gap-2 items-end ml-auto">
              <button onClick={handleQuickAdd}
                className="h-8 px-4 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition">Simpan</button>
              <button onClick={() => { setShowQuickAdd(false); setQuickForm(blankForm); }}
                className="h-8 px-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">Batal</button>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Success rate, revision, initiative, knowledge, grade → klik langsung di tabel setelah tersimpan</p>
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
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-20"}>Month</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>PIC</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>On-Time</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>Success</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-16"}>Revision</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Init</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Know</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-14"}>Score</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3 w-12"}>Grade ⚡</th>
                  <th className="px-3 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const saving = isSaving[item.id];
                  const isExpanded = expandedRow === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cn("border-b border-slate-50 transition-colors group hover:bg-slate-50/50 cursor-pointer", isExpanded && "bg-emerald-50/20")}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-mono font-bold text-slate-400">{idx + 1}</span></td>
                        <td className="px-3 py-2.5">
                          <span className="text-[12px] font-bold tabular-nums text-slate-700">{item.month}</span>
                        </td>
                        <td className="px-3 py-2.5"><span className="text-[12px] font-bold text-slate-700">{item.pic}</span></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.ontimePct} min={0} max={100} onSave={v => updateField(item.id, "ontimePct", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.trialSuccessRate} min={0} max={100} onSave={v => updateField(item.id, "trialSuccessRate", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.revisionRate} min={0} max={100} onSave={v => updateField(item.id, "revisionRate", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.initiativeScore} min={0} max={100} onSave={v => updateField(item.id, "initiativeScore", v)} /></td>
                        <td className="px-3 py-2.5"><InlineNumber value={item.knowledgeContribution} min={0} max={100} onSave={v => updateField(item.id, "knowledgeContribution", v)} /></td>
                        <td className="px-3 py-2.5">
                          <span className={cn("text-[13px] font-black tabular-nums", item.compositeScore !== null && item.compositeScore !== undefined ? "text-slate-900" : "text-slate-300")}>
                            {item.compositeScore ?? "—"}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <button type="button" onClick={e => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); e.stopPropagation(); setQuickGrade({ id: item.id, value: item.grade, rect: r }); }}
                            className={cn("inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold whitespace-nowrap transition hover:ring-2 hover:ring-blue-200 cursor-pointer min-w-[28px] justify-center",
                              item.grade ? GRADE_STYLES[item.grade] : "bg-slate-50 border-slate-200 text-slate-400")}>
                            {item.grade || "—"}
                          </button>
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
                        <tr className="bg-emerald-50/30 border-b border-emerald-100">
                          <td colSpan={11} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                              {DETAIL_FIELDS.map(field => {
                                const val = (item as any)[field];
                                return (
                                  <div key={field}>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{FIELD_LABELS[field] || field}</p>
                                    <p className={cn("text-[13px] font-bold", field === "compositeScore" ? "text-slate-900 text-[16px]" : "text-slate-800")}>
                                      {val ?? "—"}
                                      {(field === "ontimePct" || field === "trialSuccessRate" || field === "revisionRate") ? "%" : ""}
                                    </p>
                                  </div>
                                );
                              })}
                              <div>
                                <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Grade</p>
                                <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[12px] font-bold mt-0.5", item.grade ? GRADE_STYLES[item.grade] : "bg-slate-50 border-slate-200 text-slate-400")}>
                                  {item.grade || "—"}
                                </span>
                              </div>
                            </div>
                            {/* Inline edit */}
                            <div className="mt-4 pt-3 border-t border-emerald-100 flex flex-wrap gap-3 items-start">
                              <div className="flex items-center gap-2">
                                <FieldLabel>On-Time %:</FieldLabel>
                                <InlineNumber value={item.ontimePct} min={0} max={100} onSave={v => updateField(item.id, "ontimePct", v)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <FieldLabel>Success Rate:</FieldLabel>
                                <InlineNumber value={item.trialSuccessRate} min={0} max={100} onSave={v => updateField(item.id, "trialSuccessRate", v)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <FieldLabel>Init Score:</FieldLabel>
                                <InlineNumber value={item.initiativeScore} min={0} max={100} onSave={v => updateField(item.id, "initiativeScore", v)} />
                              </div>
                              <div className="flex items-center gap-2">
                                <FieldLabel>Knowledge:</FieldLabel>
                                <InlineNumber value={item.knowledgeContribution} min={0} max={100} onSave={v => updateField(item.id, "knowledgeContribution", v)} />
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

      {/* Floating Quick Select: Grade */}
      <FloatingQuickSelect
        open={!!quickGrade}
        onClose={() => setQuickGrade(null)}
        title="Grade"
        options={GRADES}
        value={quickGrade?.value || ""}
        onSelect={val => { if (quickGrade) updateField(quickGrade.id, "grade", val); }}
        colorMap={GRADE_STYLES}
        anchorRect={quickGrade?.rect}
      />
    </DashboardShell>
  );
}
