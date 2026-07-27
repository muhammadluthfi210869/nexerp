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
import {
  Search,
  Phone,
  Mail,
  ExternalLink,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Database,
  Activity,
  CheckCircle2,
  Clock,
  UserCheck,
  BarChart3,
  CalendarDays,
} from "lucide-react";

interface Lead {
  id: string; trackingCode: string; intent: string | null;
  pageUrl: string | null; pageTitle: string | null; referrer: string | null;
  utmSource: string | null; utmCampaign: string | null;
  deviceType: string | null; browser: string | null;
  phone: string | null; waName: string | null;
  fullName: string | null; company: string | null; email: string | null;
  notes: string | null; status: string; source: string | null;
  workflowStatus: string;
  kommoPipelineName: string | null; kommoStatusName: string | null; kommoSourceName: string | null;
  kommoTalkStatus: string | null; kommoTalkIsRead: boolean | null; kommoTalkIsInWork: boolean | null;
  kommoFirstResponseSec: number | null;
  assignedUser: { id: string; fullName: string; email: string } | null;
  contactedAt: string | null; createdAt: string; updatedAt: string;
}

interface StatsData {
  total: number; today: number; thisWeek: number; thisMonth: number;
  byStatus: Record<string, number>; bySource: Record<string, number>;
}

interface BusdevAnalytics {
  id: string | null;
  name: string;
  email: string | null;
  total: number;
  contacted: number;
  qualified: number;
  won: number;
  lost: number;
  active: number;
  conversationsInWork: number;
  unanswered: number;
  avgResponseSec: number | null;
  responseSamples: number;
  conversionRate: number;
  qualificationRate: number;
  byStatus: Record<string, number>;
  byWorkflow: Record<string, number>;
}

interface LeadDashboardAnalytics {
  total: number;
  newLast7Days: number;
  conversionRate: number;
  qualificationRate: number;
  byStatus: Record<string, number>;
  byWorkflow: Record<string, number>;
  bySource: Record<string, number>;
  dailyTrend: { date: string; count: number }[];
  busdev: BusdevAnalytics[];
  dataQuality: {
    unassigned: number;
    noPhone: number;
    noName: number;
    pendingOver24h: number;
  };
  conversations: {
    inWork: number;
    unanswered: number;
    avgResponseSec: number | null;
    responseSamples: number;
  };
  importSources: {
    kommoImported: number;
    websiteTracked: number;
    csvImported: number;
  };
  won: number;
  lost: number;
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

function formatPercent(value: number) {
  return `${Math.round((value || 0) * 100)}%`;
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null) return "-";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}

function getMonthRange(month: string) {
  if (!month) return null;
  const [year, monthNumber] = month.split("-").map(Number);
  if (!year || !monthNumber) return null;
  const start = new Date(year, monthNumber - 1, 1);
  const end = new Date(year, monthNumber, 0, 23, 59, 59, 999);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

function getCurrentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function LeadCaptureDashboard() {
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [analytics, setAnalytics] = useState<LeadDashboardAnalytics | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthValue());
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
      const range = getMonthRange(selectedMonth);
      if (range) {
        params.set("dateFrom", range.dateFrom);
        params.set("dateTo", range.dateTo);
      }
      if (search) params.set("search", search);
      if (filterStatus) params.set("status", filterStatus);
      const resp = await api.get(`/lead-capture?${params}`);
      setLeads(resp.data.data);
      setTotalPages(resp.data.meta.totalPages);
      setTotalLeads(resp.data.meta.total); setPage(p);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Gagal");
    } finally { setLoading(false); }
  }, [search, filterStatus, selectedMonth]);

  const fetchStats = useCallback(async () => {
    try { const resp = await api.get("/lead-capture/stats"); setStats(resp.data); } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      const range = getMonthRange(selectedMonth);
      if (range) {
        params.set("dateFrom", range.dateFrom);
        params.set("dateTo", range.dateTo);
      }
      const resp = await api.get(`/lead-capture/dashboard?${params}`);
      setAnalytics(resp.data);
    } catch {}
  }, [selectedMonth]);

  useEffect(() => { fetchLeads(); fetchStats(); fetchAnalytics(); }, [fetchLeads, fetchStats, fetchAnalytics]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      fetchLeads(page);
      fetchStats();
      fetchAnalytics();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [fetchLeads, fetchStats, fetchAnalytics, page]);

  const quickUpdate = async (id: string, data: any) => {
    try { await api.patch(`/lead-capture/${id}`, data); fetchLeads(page); fetchStats(); fetchAnalytics(); }
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
      setSelectedLeads(new Set()); fetchLeads(page); fetchStats(); fetchAnalytics();
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
    <div data-marketing-page="lead-capture" className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <SectionLabel>Lead Capture CRM</SectionLabel>
          <p className="text-sm text-slate-400 mt-1 font-medium">Zero-friction WhatsApp leads &mdash; dreamlab.id</p>
        </div>
        <div className="flex gap-2">
          <div data-marketing-surface="filter-control" className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <CalendarDays className="h-4 w-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-bold text-slate-600 outline-none"
              aria-label="Filter bulan lead"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedMonth("");
                setPage(1);
              }}
              className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700"
            >
              All
            </button>
          </div>
          <DnaButton variant={viewMode === "table" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("table")}>Table</DnaButton>
          <DnaButton variant={viewMode === "kanban" ? "primary" : "outline"} size="sm" onClick={() => setViewMode("kanban")}>Kanban</DnaButton>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: selectedMonth ? "Leads Periode" : "Total Leads", value: analytics?.total ?? stats.total, color: "from-blue-500 to-blue-600", icon: Users },
            { label: "Hari Ini", value: stats.today, color: "from-emerald-500 to-emerald-600", icon: Activity },
            { label: selectedMonth ? "New 7 Days" : "Minggu Ini", value: analytics?.newLast7Days ?? stats.thisWeek, color: "from-violet-500 to-violet-600", icon: TrendingUp },
            { label: selectedMonth ? "Won Periode" : "Bulan Ini", value: analytics?.won ?? stats.thisMonth, color: "from-amber-500 to-amber-600", icon: Target },
          ].map((kpi) => (
            <div key={kpi.label} data-marketing-surface="lead-kpi" className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group">
              <div className={`absolute inset-0 opacity-[0.03] bg-gradient-to-br ${kpi.color}`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-slate-400" />
                </div>
                <div className="text-3xl font-black text-slate-800 tracking-tight">{kpi.value.toLocaleString()}</div>
                <div className="mt-2 h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r ${kpi.color} transition-all`}
                    style={{ width: `${Math.min(100, (kpi.value / (stats.total || 1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="flex gap-3">
          {[
            { label: "WA Contacted", value: stats.byStatus?.WA_CONTACTED || 0, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
            { label: "Qualified", value: stats.byStatus?.QUALIFIED || 0, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
            { label: "Converted", value: stats.byStatus?.CONVERTED || 0, color: "text-violet-600", bg: "bg-violet-50 border-violet-100" },
          ].map((item) => (
            <div key={item.label} data-marketing-surface="lead-mini-kpi" className={`flex-1 rounded-xl border ${item.bg} px-4 py-3`}>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.label}</span>
              <div className={`text-xl font-black mt-0.5 ${item.color}`}>{item.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      {analytics && renderAnalytics()}

      {viewMode === "kanban" ? renderKanban() : renderTable()}
    </div>
  );

  function renderAnalytics() {
    if (!analytics) return null;
    const sourceEntries = Object.entries(analytics.bySource);
    const maxSource = Math.max(1, ...sourceEntries.map(([, count]) => count));
    const maxTrend = Math.max(1, ...analytics.dailyTrend.map((item) => item.count));
    const workflowEntries = Object.entries(analytics.byWorkflow);

    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <DashboardCard label="Executive Snapshot" className="xl:col-span-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "New 7 Days", value: analytics.newLast7Days, icon: Clock, tone: "text-blue-600 bg-blue-50" },
              { label: "Qualified Rate", value: formatPercent(analytics.qualificationRate), icon: UserCheck, tone: "text-emerald-600 bg-emerald-50" },
              { label: "Won Rate", value: formatPercent(analytics.conversionRate), icon: CheckCircle2, tone: "text-violet-600 bg-violet-50" },
              { label: "Avg Response", value: formatDuration(analytics.conversations.avgResponseSec), icon: Clock, tone: "text-slate-700 bg-slate-50" },
            ].map((item) => (
              <div key={item.label} data-marketing-surface="analytics-tile" className="rounded-xl border border-slate-100 p-4">
                <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="text-2xl font-black text-slate-800">{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard label="Lead Source" className="xl:col-span-4">
          <div className="space-y-3">
            {sourceEntries.length === 0 ? (
              <p className="text-sm font-medium text-slate-400">Belum ada source.</p>
            ) : sourceEntries.slice(0, 6).map(([source, count]) => (
              <div key={source}>
                <div className="mb-1 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">{formatLabel(source)}</span>
                  <span className="text-slate-400">{count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max(4, (count / maxSource) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard label="Data Quality Queue" className="xl:col-span-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Kommo Leads", value: analytics.importSources.kommoImported },
              { label: "No Phone", value: analytics.dataQuality.noPhone },
              { label: "Conversation", value: analytics.conversations.inWork },
              { label: "Unanswered", value: analytics.conversations.unanswered },
            ].map((item) => (
              <div key={item.label} data-marketing-surface="warning-tile" className="rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                <AlertTriangle className="mb-3 h-4 w-4 text-amber-600" />
                <div className="text-2xl font-black text-slate-800">{item.value.toLocaleString()}</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-wider text-amber-700">{item.label}</div>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard label="Busdev Leaderboard" className="xl:col-span-7">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="py-3 pr-4 text-[9px] font-black uppercase tracking-wider text-slate-400">Busdev</th>
                  <th className="py-3 px-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Total</th>
                  <th className="py-3 px-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Active</th>
                  <th className="py-3 px-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Talk</th>
                  <th className="py-3 px-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Unanswered</th>
                  <th className="py-3 px-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Avg Resp</th>
                  <th className="py-3 px-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Won</th>
                  <th className="py-3 pl-3 text-[9px] font-black uppercase tracking-wider text-slate-400">Rate</th>
                </tr>
              </thead>
              <tbody>
                {analytics.busdev.slice(0, 8).map((person) => (
                  <tr key={person.id || "UNASSIGNED"} className="border-b border-slate-50">
                    <td className="py-3 pr-4">
                      <div className="text-sm font-black text-slate-800">{person.name}</div>
                      {person.email && <div className="text-[10px] font-medium text-slate-400">{person.email}</div>}
                    </td>
                    <td className="py-3 px-3 text-sm font-bold text-slate-700">{person.total.toLocaleString()}</td>
                    <td className="py-3 px-3 text-sm font-bold text-blue-600">{person.active.toLocaleString()}</td>
                    <td className="py-3 px-3 text-sm font-bold text-emerald-600">{person.conversationsInWork.toLocaleString()}</td>
                    <td className="py-3 px-3 text-sm font-bold text-amber-600">{person.unanswered.toLocaleString()}</td>
                    <td className="py-3 px-3 text-sm font-bold text-slate-700">{formatDuration(person.avgResponseSec)}</td>
                    <td className="py-3 px-3 text-sm font-bold text-violet-600">{person.won.toLocaleString()}</td>
                    <td className="py-3 pl-3 text-sm font-black text-slate-700">{formatPercent(person.conversionRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>

        <DashboardCard label="Pipeline Funnel" className="xl:col-span-5">
          <div className="space-y-3">
            {workflowEntries.length === 0 ? (
              <p className="text-sm font-medium text-slate-400">Belum ada pipeline.</p>
            ) : workflowEntries.map(([stage, count]) => (
              <div key={stage} data-marketing-surface="pipeline-row" className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <BarChart3 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="truncate text-xs font-bold text-slate-600">{formatLabel(stage)}</span>
                </div>
                <DnaBadge status={getStageBadge(stage)}>{count}</DnaBadge>
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard label="14-Day Lead Trend" className="xl:col-span-12">
          <div className="flex h-36 items-end gap-2">
            {analytics.dailyTrend.length === 0 ? (
              <p className="self-center text-sm font-medium text-slate-400">Belum ada trend 14 hari.</p>
            ) : analytics.dailyTrend.map((item) => (
              <div key={item.date} className="flex min-w-10 flex-1 flex-col items-center gap-2">
                <div className="text-[10px] font-bold text-slate-400">{item.count}</div>
                <div className="w-full rounded-t-lg bg-slate-800" style={{ height: `${Math.max(8, (item.count / maxTrend) * 92)}px` }} />
                <div className="text-[9px] font-bold text-slate-400">{new Date(item.date).getDate()}</div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    );
  }

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
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Source</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Busdev</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Status</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Pipeline</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Talk</th>
                  <th className="p-4 text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.1em]">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={10} className="p-12 text-center text-slate-300 text-sm font-medium">Belum ada leads.</td></tr>
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
                    <td className="p-4 max-w-[140px]">
                      <div className="text-sm font-bold text-slate-700 truncate" title={lead.kommoSourceName || lead.source || ""}>{lead.kommoSourceName || lead.source || "-"}</div>
                      {lead.intent && <div className="text-[10px] text-slate-400 truncate" title={lead.intent}>{lead.intent}</div>}
                    </td>
                    <td className="p-4 max-w-[140px]">
                      <div className="text-sm font-bold text-slate-700 truncate" title={lead.kommoPipelineName || ""}>{lead.kommoPipelineName?.replace(/_/g, " ") || "-"}</div>
                      {lead.kommoStatusName && <div className="text-[10px] text-slate-400 truncate" title={lead.kommoStatusName}>{lead.kommoStatusName}</div>}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${getStatusColor(lead.status)}`}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4"><DnaBadge status={getStageBadge(lead.workflowStatus)}>{lead.workflowStatus.replace(/_/g, " ")}</DnaBadge></td>
                    <td className="p-4">
                      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">{lead.kommoTalkStatus || "-"}</div>
                      <div className={lead.kommoTalkIsRead === false ? "text-[10px] font-bold text-amber-600" : "text-[10px] text-slate-400"}>
                        {lead.kommoTalkIsRead === false ? "Unanswered" : formatDuration(lead.kommoFirstResponseSec)}
                      </div>
                    </td>
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
            data-marketing-surface="kanban-column"
            className="rounded-[24px] border-2 border-slate-100 bg-slate-50/50 p-3 flex flex-col gap-2"
            onDragOver={handleDragOver} onDrop={() => handleDrop(key)}
          >
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">{label}</span>
              <DnaBadge status={badge}>{items.length}</DnaBadge>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto max-h-[70vh] min-h-[200px]">
              {items.map((lead) => (
                <div key={lead.id} data-marketing-surface="lead-card" draggable onDragStart={() => handleDragStart(lead.id)}
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
