"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  DashboardCard,
  TableWrapper,
  StatCard,
  DnaBadge,
  DnaButton,
  DnaInput,
  SectionLabel,
} from "@/components/dna";
import { Search, Phone, Mail, Globe, Calendar, ExternalLink } from "lucide-react";

interface Lead {
  id: string; trackingCode: string; intent: string | null;
  pageUrl: string | null; pageTitle: string | null; referrer: string | null;
  utmSource: string | null; utmCampaign: string | null;
  deviceType: string | null; browser: string | null;
  phone: string | null; waName: string | null;
  fullName: string | null; company: string | null; email: string | null;
  notes: string | null; status: string; source: string | null;
  workflowStatus: string;
  assignedUser: { id: string; fullName: string; email: string } | null;
  contactedAt: string | null; createdAt: string; updatedAt: string;
}

interface StatsData {
  total: number; today: number; thisWeek: number; thisMonth: number;
  byStatus: Record<string, number>; bySource: Record<string, number>;
}

const PIPELINE_STAGES: { key: string; label: string; badge: BadgeStatus }[] = [
  { key: "NEW_LEAD", label: "Cold Leads", badge: "default" },
  { key: "CONTACTED", label: "Contacted", badge: "info" },
  { key: "FOLLOW_UP_1", label: "Follow Up", badge: "warning" },
  { key: "NEGOTIATION", label: "Hot Leads", badge: "critical" },
  { key: "WON_DEAL", label: "Won", badge: "success" },
  { key: "LOST", label: "Lost", badge: "default" },
];

type BadgeStatus = "success" | "info" | "warning" | "critical" | "purple" | "default";

const STAGE_BADGE: Record<string, BadgeStatus> = {
  NEW_LEAD: "default", CONTACTED: "info", FOLLOW_UP_1: "warning",
  FOLLOW_UP_2: "warning", FOLLOW_UP_3: "warning", NEGOTIATION: "critical",
  WON_DEAL: "success", LOST: "default", ABORTED: "default",
};

function getStageBadge(s: string): BadgeStatus { return STAGE_BADGE[s] || "default"; }

function getStatusColor(s: string) {
  switch(s) {
    case "PENDING": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "WA_CONTACTED": return "bg-blue-100 text-blue-700 border-blue-200";
    case "QUALIFIED": return "bg-green-100 text-green-700 border-green-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

export default function LeadCaptureDashboard() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [dragLeadId, setDragLeadId] = useState<string | null>(null);

  const fetchLeads = useCallback(async (p = 1) => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p)); params.set("limit", "50");
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      const resp = await api.get(`/lead-capture?${params}`);
      setLeads(resp.data.data);
      setTotalPages(resp.data.meta.totalPages);
      setTotalLeads(resp.data.meta.total); setPage(p);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal");
    } finally { setLoading(false); }
  }, [search, filterStatus]);

  const fetchStats = useCallback(async () => {
    try { const resp = await api.get("/lead-capture/stats"); setStats(resp.data); } catch {}
  }, []);

  useEffect(() => { fetchLeads(); fetchStats(); }, [fetchLeads, fetchStats]);

  const quickUpdate = async (id: string, data: any) => {
    try { await api.patch(`/lead-capture/${id}`, data); fetchLeads(page); fetchStats(); }
    catch (err: any) { alert("Gagal: " + (err?.response?.data?.message || err.message)); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedLeads);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedLeads(next);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.size === leads.length) setSelectedLeads(new Set());
    else setSelectedLeads(new Set(leads.map(l => l.id)));
  };

  const handleBulkUpdate = async () => {
    if (!bulkStatus || selectedLeads.size === 0) return;
    try {
      await api.post("/lead-capture/bulk-update", { ids: Array.from(selectedLeads), status: bulkStatus });
      setSelectedLeads(new Set()); fetchLeads(page); fetchStats();
    } catch (err: any) { alert("Gagal: " + (err?.response?.data?.message || err.message)); }
  };

  const handleDragStart = (leadId: string) => setDragLeadId(leadId);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = async (targetStage: string) => {
    if (!dragLeadId) return;
    await quickUpdate(dragLeadId, { workflowStatus: targetStage });
    setDragLeadId(null);
  };

  if (loading && leads.length === 0) {
    return <div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full" /></div>;
  }

  if (error && leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-red-500 font-semibold">{error}</p>
        <DnaButton variant="primary" onClick={() => fetchLeads()}>Coba Lagi</DnaButton>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <SectionLabel>Lead Capture CRM</SectionLabel>
          <p className="text-sm text-slate-400 mt-1 font-medium">Zero-friction WhatsApp leads &mdash; dreamlab.id</p>
        </div>
        <div className="flex gap-2">
          <DnaButton variant={viewMode === "table" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("table")}>Table</DnaButton>
          <DnaButton variant={viewMode === "kanban" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>Kanban</DnaButton>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Total" value={stats.total.toLocaleString()} icon={<Globe />} />
          <StatCard label="Today" value={stats.today.toLocaleString()} icon={<Calendar />} />
          <StatCard label="Week" value={stats.thisWeek.toLocaleString()} />
          <StatCard label="Month" value={stats.thisMonth.toLocaleString()} />
          <StatCard label="WA Contacted" value={(stats.byStatus?.WA_CONTACTED || 0).toLocaleString()} />
          <StatCard label="Qualified" value={(stats.byStatus?.QUALIFIED || 0).toLocaleString()} />
          <StatCard label="Converted" value={(stats.byStatus?.CONVERTED || 0).toLocaleString()} />
        </div>
      )}

      {viewMode === "kanban" ? renderKanban() : renderTable()}
    </div>
  );

  function renderTable() {
    return (
      <>
        <TableWrapper filters={
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex-1 min-w-[200px]">
              <DnaInput icon={<Search />} placeholder="Cari nama, telepon, tracking..." value={search}
                onChange={(e) => { setSearch(e.target.value); fetchLeads(1); }} />
            </div>
            <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); fetchLeads(1); }}
              className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all">
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="WA_CONTACTED">WA Contacted</option>
              <option value="QUALIFIED">Qualified</option>
            </select>
            {selectedLeads.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{selectedLeads.size} selected</span>
                <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)}
                  className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium">
                  <option value="">Update...</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="WA_CONTACTED">WA Contacted</option>
                  <option value="CONVERTED">Converted</option>
                </select>
                <DnaButton variant="primary" size="sm" onClick={handleBulkUpdate} disabled={!bulkStatus}>Apply</DnaButton>
              </div>
            )}
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="p-4"><input type="checkbox" checked={selectedLeads.size === leads.length && leads.length > 0} onChange={toggleSelectAll} className="rounded" /></th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Tracking</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Info</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Kontak</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Intent</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Status</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Pipeline</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={8} className="p-12 text-center text-slate-300 text-sm font-medium">Belum ada leads.</td></tr>
                ) : leads.map((lead) => (
                  <tr key={lead.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedLead === lead.id ? "bg-blue-50/30" : ""}`}
                    onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedLeads.has(lead.id)} onChange={() => toggleSelect(lead.id)} className="rounded" />
                    </td>
                    <td className="p-4"><span className="font-mono text-[11px] font-bold text-slate-700">{lead.trackingCode}</span></td>
                    <td className="p-4">
                      {editingId === `${lead.id}-name` ? (
                        <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => { quickUpdate(lead.id, { fullName: editValue }); setEditingId(null); }}
                          onKeyDown={(e) => e.key === "Enter" && (quickUpdate(lead.id, { fullName: editValue }), setEditingId(null))}
                          className="px-2 py-1 border rounded-lg text-sm w-36" onClick={(e) => e.stopPropagation()} />
                      ) : (
                        <span className="font-semibold text-slate-800 cursor-pointer hover:text-blue-600 text-sm"
                          onClick={(e) => { e.stopPropagation(); setEditingId(`${lead.id}-name`); setEditValue(lead.fullName || ""); }}>
                          {lead.fullName || <span className="text-slate-300 italic">-</span>}
                        </span>
                      )}
                      {lead.company && <div className="text-[10px] text-slate-400 font-medium mt-0.5">{lead.company}</div>}
                    </td>
                    <td className="p-4">
                      {lead.phone ? (
                        <a href={`https://wa.me/${lead.phone.replace(/\+/g, "")}`} target="_blank" rel="noopener"
                          className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Phone className="w-3 h-3" /> {lead.phone}
                        </a>
                      ) : <span className="text-slate-300 italic text-sm">-</span>}
                      {lead.email && <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5"><Mail className="w-2.5 h-2.5" /> {lead.email}</div>}
                      {lead.waName && <div className="text-[10px] text-slate-400 mt-0.5">WA: {lead.waName}</div>}
                    </td>
                    <td className="p-4 max-w-[180px]">
                      <div className="text-sm text-slate-600 truncate" title={lead.intent || ""}>{lead.intent || "-"}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4"><DnaBadge status={getStageBadge(lead.workflowStatus)}>{lead.workflowStatus.replace(/_/g, " ")}</DnaBadge></td>
                    <td className="p-4 text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(lead.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-slate-50 bg-slate-50/30">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{totalLeads} leads</span>
              <div className="flex gap-1">
                <DnaButton variant="outline" size="sm" onClick={() => fetchLeads(page - 1)} disabled={page <= 1}>Prev</DnaButton>
                <DnaButton variant="outline" size="sm" onClick={() => fetchLeads(page + 1)} disabled={page >= totalPages}>Next</DnaButton>
              </div>
            </div>
          )}
        </TableWrapper>

        {expandedLead && (
          <LeadDetailPanel lead={leads.find(l => l.id === expandedLead)!} onClose={() => setExpandedLead(null)}
            onUpdate={(data) => quickUpdate(expandedLead, data)} />
        )}
      </>
    );
  }

  function renderKanban() {
    const groupedLeads = PIPELINE_STAGES.map(s => ({ ...s, items: leads.filter(l => l.workflowStatus === s.key) }));
    return (
      <div className="grid grid-cols-6 gap-4 min-h-[60vh]">
        {groupedLeads.map(({ key, label, badge, items }) => (
          <div key={key}
            className="rounded-[24px] border-2 border-slate-100 bg-slate-50/50 p-3 flex flex-col gap-2"
            onDragOver={handleDragOver} onDrop={() => handleDrop(key)}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
              <DnaBadge status={badge}>{items.length}</DnaBadge>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] min-h-[200px]">
              {items.map((lead) => (
                <div key={lead.id} draggable onDragStart={() => handleDragStart(lead.id)}
                  className={`bg-white rounded-xl border border-slate-100 p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${dragLeadId === lead.id ? "opacity-50 ring-2 ring-blue-400" : ""}`}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="font-mono text-[9px] font-bold text-slate-400">{lead.trackingCode}</span>
                    {lead.phone && <span className="text-[10px] text-emerald-600 font-bold">{lead.phone.slice(-4)}</span>}
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-tight">{lead.fullName || "Unknown"}</p>
                  {lead.intent && <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{lead.intent}</p>}
                  <div className="flex items-center gap-1.5 mt-2">
                    {lead.phone && <Phone className="w-2.5 h-2.5 text-slate-300" />}
                    <span className={`ml-auto inline-block px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase ${getStatusColor(lead.status)}`}>
                      {lead.status === "PENDING" ? "New" : lead.status.slice(0, 4)}
                    </span>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="flex-1 flex items-center justify-center min-h-[100px]">
                  <p className="text-[10px] text-slate-300 font-medium italic">Drop here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

function LeadDetailPanel({ lead, onClose, onUpdate }: { lead: Lead; onClose: () => void; onUpdate: (data: any) => void }) {
  const [editData, setEditData] = useState({
    fullName: lead.fullName || "", company: lead.company || "",
    email: lead.email || "", phone: lead.phone || "",
    notes: lead.notes || "", status: lead.status, workflowStatus: lead.workflowStatus,
  });

  return (
    <DashboardCard label={`Lead Detail — ${lead.trackingCode}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="space-y-4">
          {["fullName", "company"].map(f => (
            <div key={f}>
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1">{f === "fullName" ? "Nama" : "Perusahaan"}</p>
              <input value={(editData as any)[f]} onChange={(e) => setEditData({ ...editData, [f]: e.target.value })}
                className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            {["email", "phone"].map(f => (
              <div key={f}>
                <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1">{f}</p>
                <input value={(editData as any)[f]} onChange={(e) => setEditData({ ...editData, [f]: e.target.value })}
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1">Status</p>
            <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium">
              <option value="PENDING">Pending</option>
              <option value="WA_CONTACTED">WA Contacted</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="CONVERTED">Converted</option>
            </select>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1">Pipeline</p>
            <select value={editData.workflowStatus} onChange={(e) => setEditData({ ...editData, workflowStatus: e.target.value })}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-medium">
              {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em] mb-1">Catatan</p>
            <textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium resize-none focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all" />
          </div>
        </div>
      </div>

      {lead.pageUrl && (
        <div className="bg-slate-50 rounded-2xl p-4 text-[10px] text-slate-500 space-y-1 mb-6">
          <div className="flex gap-4 flex-wrap">
            <span><strong>Page:</strong> {lead.pageUrl}</span>
            <span><strong>Device:</strong> {lead.deviceType || "-"}</span>
            {lead.utmSource && <span><strong>UTM:</strong> {lead.utmSource}</span>}
            {lead.waName && <span><strong>WA Name:</strong> {lead.waName}</span>}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <DnaButton variant="primary" onClick={() => onUpdate(editData)}>Simpan</DnaButton>
        <DnaButton variant="outline" onClick={onClose}>Tutup</DnaButton>
        {lead.phone && (
          <a href={`https://wa.me/${lead.phone.replace(/\+/g, "")}`} target="_blank" rel="noopener"
            className="inline-flex items-center gap-2 h-11 px-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-100 transition-all ml-auto">
            <ExternalLink className="w-3.5 h-3.5" /> Buka WA
          </a>
        )}
      </div>
    </DashboardCard>
  );
}
