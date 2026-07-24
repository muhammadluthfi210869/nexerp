"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Search, RefreshCw, Lightbulb, Users, CheckSquare, TrendingUp, MessageSquare } from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard, DnaButton } from "@/components/dna";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

import { InlineText, InlineTextarea, SaveDot, StatusBadge, FieldLabel } from "@/components/rnd/rnd-table-shared";
import { TYPOGRAPHY, CHIP_CLASSES, TABLE_WRAPPER } from "@/components/rnd/rnd-constants";

type HTItem = {
  id: string;
  date: string;
  strategicTask: string;
  teamSupport: string;
  approvalGiven: string;
  innovationConcept: string;
  escalationHandled: string;
  notes: string;
};

const FIELD_LABELS: Record<string, string> = {
  strategicTask: "Strategic Task", teamSupport: "Team Support",
  approvalGiven: "Approval", innovationConcept: "Innovation",
  escalationHandled: "Escalation", notes: "Notes",
};

const DETAIL_FIELDS = ["strategicTask", "teamSupport", "approvalGiven", "innovationConcept", "escalationHandled", "notes"] as const;

export default function HeadTrackerClient() {
  const [data, setData] = useState<HTItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const today = () => new Date().toISOString().slice(0, 10);

  const blankForm = {
    date: today(), strategicTask: "", teamSupport: "",
    approvalGiven: "", innovationConcept: "", escalationHandled: "", notes: "",
  };
  const [quickForm, setQuickForm] = useState(blankForm);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/rnd/head-tracker");
      setData((res.data || []).map((t: any) => ({
        id: t.id, date: t.date?.slice(0, 10) || "",
        strategicTask: t.strategicTask || "", teamSupport: t.teamSupport || "",
        approvalGiven: t.approvalGiven || "", innovationConcept: t.innovationConcept || "",
        escalationHandled: t.escalationHandled || "", notes: t.notes || "",
      })));
    } catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveField = useCallback(async (id: string, field: string, value: any) => {
    setIsSaving(p => ({ ...p, [id]: true }));
    try { await api.patch("/rnd/head-tracker/" + id, { [field]: value }); } catch {}
    finally { setIsSaving(p => ({ ...p, [id]: false })); }
  }, []);

  const updateField = useCallback((id: string, field: string, value: any) => {
    setData(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    saveField(id, field, value);
  }, [saveField]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Hapus entry ini?")) return;
    try { await api.delete("/rnd/head-tracker/" + id); } catch {}
    setData(prev => prev.filter(d => d.id !== id));
    if (expandedRow === id) setExpandedRow(null);
  }, [expandedRow]);

  const handleQuickAdd = useCallback(async () => {
    try {
      const payload: any = { ...quickForm };
      Object.keys(payload).forEach(k => { if (!payload[k]) payload[k] = undefined; });
      await api.post("/rnd/head-tracker", payload);
      await fetchData();
    } catch {
      setData(prev => [{ id: "NEW-" + Date.now(), ...quickForm }, ...prev]);
    }
    setShowQuickAdd(false);
    setQuickForm(blankForm);
  }, [quickForm, fetchData, blankForm]);

  const filteredData = useMemo(() => {
    return [...data].sort((a, b) => b.date.localeCompare(a.date));
  }, [data]);

  const totalInnovations = data.filter(d => d.innovationConcept).length;
  const totalApprovals = data.filter(d => d.approvalGiven).length;
  const totalEscalations = data.filter(d => d.escalationHandled).length;

  if (loading)
    return (
      <DashboardShell title="R&D" titleAccent="Head Tracker" subtitle="Loading...">
        <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
      </DashboardShell>
    );

  return (
    <DashboardShell title="R&D" titleAccent="Head Tracker"
      subtitle="Strategic contributions — pekerjaan strategis Head R&D"
      actions={
        <div className="flex gap-2">
          <DnaButton variant="outline" icon={<RefreshCw />} onClick={fetchData}>Refresh</DnaButton>
          <DnaButton variant="primary" icon={<Plus />} onClick={() => { setQuickForm(blankForm); setShowQuickAdd(true); }}>New Entry</DnaButton>
        </div>
      }>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Records" value={data.length} subValue="Harian" icon={<Search />} />
        <StatCard label="Innovations" value={totalInnovations} subValue="Konsep/ide baru" icon={<Lightbulb />} className="border-purple-200" />
        <StatCard label="Approvals" value={totalApprovals} subValue="Keputusan" icon={<CheckSquare />} />
        <StatCard label="Escalations" value={totalEscalations} subValue="Masalah handled" icon={<MessageSquare />} className={totalEscalations > 0 ? "border-amber-200" : ""} />
      </div>

      {/* ── QUICK ADD SECTION ── */}
      {showQuickAdd && (
        <div className="mb-4 rounded-[24px] border-2 border-dashed border-purple-200 bg-purple-50/60 p-4">
          <p className={TYPOGRAPHY.statLabel + " mb-3 flex items-center gap-2"}>
            <Plus size={12} /> New Entry
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Date</p>
              <input type="date" value={quickForm.date} onChange={e => setQuickForm(p => ({ ...p, date: e.target.value }))}
                className="h-8 rounded-lg border border-purple-200 bg-white px-3 text-[12px] outline-none" />
            </div>
            <div className="min-w-[200px] flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Strategic Task</p>
              <input value={quickForm.strategicTask} onChange={e => setQuickForm(p => ({ ...p, strategicTask: e.target.value }))} placeholder="Pekerjaan strategis..."
                className="h-8 w-full rounded-lg border border-purple-200 bg-white px-3 text-[12px] font-semibold outline-none" />
            </div>
            <div className="flex gap-2 items-end ml-auto">
              <button onClick={handleQuickAdd}
                className="h-8 px-4 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700 transition">Simpan</button>
              <button onClick={() => { setShowQuickAdd(false); setQuickForm(blankForm); }}
                className="h-8 px-4 rounded-lg text-[11px] font-bold text-slate-400 hover:text-rose-600 transition">Batal</button>
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-2">Team support, approval, innovation, escalation → klik langsung di tabel setelah tersimpan</p>
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
                <col className="w-[200px]" />
                <col className="w-[180px]" />
                <col className="w-[180px]" />
                <col className="w-[160px]" />
                <col className="w-16" />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>#</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Date</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Strategic Task</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Team Support</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Approval Given</th>
                  <th className={TYPOGRAPHY.tableHeader + " px-3 py-3"}>Innovation Concept</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, idx) => {
                  const saving = isSaving[item.id];
                  const isExpanded = expandedRow === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={cn("border-b border-slate-50 transition-colors group hover:bg-slate-50/50 cursor-pointer", isExpanded && "bg-purple-50/20")}
                        onClick={() => setExpandedRow(isExpanded ? null : item.id)}>
                        <td className="px-3 py-2.5"><span className="text-[10px] font-mono font-bold text-slate-400">{idx + 1}</span></td>
                        <td className="px-3 py-2.5">
                          <span className="text-[12px] font-semibold text-slate-600">{item.date ? new Date(item.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</span>
                        </td>
                        <td className="px-3 py-2.5 max-w-[200px]">
                          <InlineText value={item.strategicTask} placeholder="Klik edit..." onSave={v => updateField(item.id, "strategicTask", v)} bold />
                        </td>
                        <td className="px-3 py-2.5 max-w-[180px]">
                          <InlineText value={item.teamSupport} placeholder="Klik edit..." onSave={v => updateField(item.id, "teamSupport", v)} />
                        </td>
                        <td className="px-3 py-2.5 max-w-[180px]">
                          <InlineText value={item.approvalGiven} placeholder="—" onSave={v => updateField(item.id, "approvalGiven", v)} />
                        </td>
                        <td className="px-3 py-2.5 max-w-[160px]">
                          <InlineText value={item.innovationConcept} placeholder="—" onSave={v => updateField(item.id, "innovationConcept", v)} />
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
                        <tr className="bg-purple-50/30 border-b border-purple-100">
                          <td colSpan={7} className="px-4 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                              {DETAIL_FIELDS.map(field => {
                                const val = item[field];
                                return (
                                  <div key={field} className={cn(field === "notes" ? "md:col-span-2" : "")}>
                                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">{FIELD_LABELS[field] || field}</p>
                                    <p className={cn("text-[12px] font-semibold", !val ? "text-slate-300 italic" : "text-slate-800")}>
                                      {val || "—"}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                            {/* Inline edit */}
                            <div className="mt-4 pt-3 border-t border-purple-100 flex flex-wrap gap-3">
                              <div className="flex-1 min-w-[200px]">
                                <FieldLabel>Escalation</FieldLabel>
                                <InlineText value={item.escalationHandled} placeholder="Klik untuk isi..." onSave={v => updateField(item.id, "escalationHandled", v)} />
                              </div>
                              <div className="flex-1 min-w-[200px]">
                                <FieldLabel>Notes</FieldLabel>
                                <InlineTextarea value={item.notes} placeholder="Klik untuk isi catatan..." onSave={v => updateField(item.id, "notes", v)} />
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
