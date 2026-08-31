"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { 
 ShieldCheck, 
 AlertTriangle, 
 TrendingUp,
 TrendingDown,
 FlaskConical,
 Activity,
 Package,
 Clock,
 Search,
 Filter,
 Loader2
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard, SectionLabel, TableWrapper, DnaBadge, DnaInput } from "@/components/dna";

interface QCAudit {
 id: string;
 phase: string | null;
 status: string;
 defectType: string | null;
 defectCategory: string | null;
 defectCause: string | null;
 severity: string | null;
 disposition: string | null;
 createdAt: string;
 qc?: { fullName: string };
}

interface PhaseBreakdownItem {
 phase: string;
 totalAudits: number;
 passCount: number;
 rejectCount: number;
 passRate: number;
 topDefect: { defectType: string; count: number } | null;
}

interface PhaseBreakdownData {
 phases: PhaseBreakdownItem[];
 overall: { totalPass: number; totalReject: number; overallPassRate: number };
}

interface QCStats {
 totalInspections: number;
 passRate: number;
 totalReject: number;
 activeQuarantine: number;
 lastMonthInspections?: number;
 lastMonthReject?: number;
}

export default function QCAnalyticsDashboard() {
 const [searchTerm, setSearchTerm] = React.useState("");
 const [dateRange, setDateRange] = React.useState<"today" | "week" | "month" | "all">("month");

 const { data: stats, isLoading: statsLoading } = useQuery<QCStats>({
 queryKey: ["qc-stats-simple"],
 queryFn: async () => {
 const res = await api.get("/production/qc/stats");
 const data = res.data || {};
 return {
 totalInspections: data.totalInspections || 0,
 passRate: data.passRate || 0,
 totalReject: data.totalReject || 0,
 activeQuarantine: data.activeQuarantine || 0,
 lastMonthInspections: data.lastMonthInspections,
 lastMonthReject: data.lastMonthReject,
 };
 },
 });

 const { data: phaseBreakdown, isLoading: phaseLoading } = useQuery<PhaseBreakdownData>({
 queryKey: ["qc-phase-breakdown"],
 queryFn: async () => {
 const res = await api.get("/qc/analytics/phase-breakdown");
 return res.data || { phases: [], overall: { totalPass: 0, totalReject: 0, overallPassRate: 0 } };
 },
 });

 const { data: audits, isLoading: auditsLoading } = useQuery<QCAudit[]>({
 queryKey: ["qc-recent-audits", dateRange],
 queryFn: async () => {
 const res = await api.get("/qc/report");
 const allAudits = res.data || [];
 const now = new Date();
 const filtered = allAudits.filter((a: QCAudit) => {
 const date = new Date(a.createdAt);
 switch (dateRange) {
 case "today":
 return date.toDateString() === now.toDateString();
 case "week":
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 return date >= weekAgo;
 case "month":
 const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
 return date >= monthAgo;
 default:
 return true;
 }
 });
 return filtered.slice(0, 50);
 },
 });

 const filteredAudits = useMemo(() => {
 if (!audits) return [];
 if (!searchTerm) return audits;
 const term = searchTerm.toLowerCase();
 return audits.filter(
 (a) =>
 a.phase?.toLowerCase().includes(term) ||
 a.status?.toLowerCase().includes(term) ||
 a.defectType?.toLowerCase().includes(term) ||
 a.qc?.fullName?.toLowerCase().includes(term)
 );
 }, [audits, searchTerm]);

 const compareInspections = useMemo(() => {
 if (!stats) return null;
 const current = stats.totalInspections;
 const last = stats.lastMonthInspections || 0;
 if (last === 0) return null;
 const diff = ((current - last) / last) * 100;
 return { diff, isPositive: diff >= 0 };
 }, [stats]);

 const compareReject = useMemo(() => {
 if (!stats) return null;
 const current = stats.totalReject;
 const last = stats.lastMonthReject || 0;
 if (last === 0) return null;
 const diff = ((current - last) / last) * 100;
 return { diff, isPositive: diff <= 0 };
 }, [stats]);

 const formatDate = (d: string) =>
 new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

 const severityStyle = (s: string | null) => {
 switch (s) {
 case "CRITICAL": return "bg-rose-50 text-rose-600 border border-rose-100";
 case "MAJOR": return "bg-amber-50 text-amber-600 border border-amber-100";
 default: return "bg-slate-50 text-slate-500 border border-slate-100";
 }
 };

 const statusStyle = (s: string | null) => {
 switch (s) {
 case "GOOD": case "PASSED": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
 case "REJECT": case "FAILED": return "bg-rose-50 text-rose-600 border border-rose-100";
 default: return "bg-blue-50 text-blue-600 border border-blue-100";
 }
 };

 const getDateRangeLabel = (range: string) => {
 switch (range) {
 case "today": return "Hari Ini";
 case "week": return "7 Hari";
 case "month": return "Bulan Ini";
 default: return "Semua";
 }
 };

 return (
 <DashboardShell
 title="QC"
 titleAccent="Dashboard"
 subtitle="Quality analytics dan track aktivitas inspeksi"
 >
 {/* ── SECTION 1: KPI CARDS ── */}
 <SectionLabel className="flex items-center gap-2 text-slate-500">
 <Activity className="h-3.5 w-3.5" />
 KEY PERFORMANCE INDICATORS
 </SectionLabel>

 {statsLoading ? (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
 {[1, 2, 3, 4].map((i) => (
 <div key={i} className="bg-white rounded-3xl border border-slate-100 p-6 animate-pulse">
 <div className="h-4 bg-slate-100 rounded w-1/2 mb-4" />
 <div className="h-10 bg-slate-100 rounded w-3/4" />
 </div>
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
 <StatCard
 label="Total Inspeksi"
 value={String(stats?.totalInspections || 0)}
 subValue={compareInspections ? (
 <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${compareInspections.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
 {compareInspections.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
 {Math.abs(Number(compareInspections.diff)).toFixed(1)}% vs last month
 </span>
 ) : "vs last month"}
 icon={<FlaskConical className="text-blue-600" />}
 />
 <StatCard
 label="Pass Rate"
 value={`${Number(stats?.passRate || 0).toFixed(1)}%`}
 subValue={Number(stats?.passRate || 0) >= 95 ? "Above target" : "Below target 95%"}
 icon={<ShieldCheck className="text-emerald-500" />}
 />
 <StatCard
 label="Total Reject"
 value={String(stats?.totalReject || 0)}
 subValue={compareReject ? (
 <span className={`flex items-center gap-1 text-[9px] font-bold uppercase ${compareReject.isPositive ? "text-emerald-600" : "text-rose-600"}`}>
 {compareReject.isPositive ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
 {Math.abs(Number(compareReject.diff)).toFixed(1)}% vs last month
 </span>
 ) : "vs last month"}
 icon={<AlertTriangle className="text-rose-500" />}
 />
 <StatCard
 label="Active Quarantine"
 value={String(stats?.activeQuarantine || 0)}
 subValue={(stats?.activeQuarantine || 0) === 0 ? "No holds" : "Needs attention"}
 icon={<Package className="text-amber-500" />}
 />
 </div>
 )}

 {/* ── SECTION 2: PHASE BREAKDOWN TABLE ── */}
 <SectionLabel className="flex items-center gap-2 text-slate-500">
 <Clock className="h-3.5 w-3.5" />
 PHASE BREAKDOWN
 </SectionLabel>

 <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden mb-10 shadow-sm">
 {phaseLoading ? (
 <div className="p-8 flex items-center justify-center">
 <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
 </div>
 ) : phaseBreakdown?.phases && phaseBreakdown.phases.length > 0 ? (
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 px-6 text-table-header text-slate-400 font-black uppercase tracking-wider">Phase</TableHead>
 <TableHead className="py-4 px-6 text-table-header text-slate-400 text-center font-black uppercase tracking-wider">Total</TableHead>
 <TableHead className="py-4 px-6 text-table-header text-slate-400 text-center font-black uppercase tracking-wider">Pass</TableHead>
 <TableHead className="py-4 px-6 text-table-header text-slate-400 text-center font-black uppercase tracking-wider">Reject</TableHead>
 <TableHead className="py-4 px-6 text-table-header text-slate-400 font-black uppercase tracking-wider">Pass Rate</TableHead>
 <TableHead className="py-4 px-6 text-table-header text-slate-400 font-black uppercase tracking-wider">Top Defect</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {phaseBreakdown.phases.map((p, i) => (
 <TableRow key={p.phase || i} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-4 px-6 font-black text-slate-900 text-sm uppercase">
 {p.phase}
 </TableCell>
 <TableCell className="py-4 px-6 text-center font-bold text-slate-600 text-sm tabular-nums">
 {p.totalAudits}
 </TableCell>
 <TableCell className="py-4 px-6 text-center font-bold text-emerald-600 text-sm tabular-nums">
 {p.passCount}
 </TableCell>
 <TableCell className="py-4 px-6 text-center font-bold text-rose-600 text-sm tabular-nums">
 {p.rejectCount}
 </TableCell>
 <TableCell className="py-4 px-6">
 <div className="flex items-center gap-3">
 <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all ${
 Number(p.passRate || 0) >= 95 ? "bg-emerald-500" : Number(p.passRate || 0) >= 80 ? "bg-amber-500" : "bg-rose-500"
 }`}
 style={{ width: `${Number(p.passRate || 0)}%` }}
 />
 </div>
 <span className={`font-black text-xs tabular-nums ${
 Number(p.passRate || 0) >= 95 ? "text-emerald-600" : Number(p.passRate || 0) >= 80 ? "text-amber-600" : "text-rose-600"
 }`}>
 {Number(p.passRate || 0).toFixed(1)}%
 </span>
 </div>
 </TableCell>
 <TableCell className="py-4 px-6">
 {p.topDefect ? (
 <Badge className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase rounded-lg px-2.5 py-1">
 {p.topDefect.defectType} ({p.topDefect.count})
 </Badge>
 ) : (
 <span className="text-slate-300 text-xs font-bold uppercase">—</span>
 )}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 ) : (
 <div className="p-12 flex flex-col items-center justify-center text-center">
 <FlaskConical className="h-10 w-10 text-slate-200 mb-3" />
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No phase data available</p>
 <p className="text-[9px] text-slate-300 mt-1">Start an inspection to see breakdown</p>
 </div>
 )}
 </div>

 {/* ── SECTION 3: RECENT AUDITS TABLE ── */}
 <SectionLabel className="flex items-center gap-2 text-slate-500">
 <Activity className="h-3.5 w-3.5" />
 RECENT AUDITS
 </SectionLabel>

 <TableWrapper
 filters={
 <div className="flex flex-col md:flex-row items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <span className="status-dot bg-emerald-500" />
 <div>
 <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
 Audit Trail
 </h3>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
 Real-time • {filteredAudits.length} Records
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3 w-full md:w-auto">
 <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-150">
 {(["today", "week", "month", "all"] as const).map((range) => (
 <button
 key={range}
 onClick={() => setDateRange(range)}
 className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all border-none cursor-pointer ${
 dateRange === range
 ? "bg-white text-slate-900 shadow-sm"
 : "text-slate-500 hover:text-slate-800"
 }`}
 >
 {getDateRangeLabel(range)}
 </button>
 ))}
 </div>
 <div className="flex-1 md:w-56">
 <DnaInput
 icon={<Search />}
 placeholder="Cari audit..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 </div>
 </div>
 }
 >
 {auditsLoading ? (
 <div className="p-12 flex items-center justify-center">
 <Loader2 className="h-8 w-8 text-slate-300 animate-spin" />
 </div>
 ) : filteredAudits.length === 0 ? (
 <div className="p-12 flex flex-col items-center justify-center text-center">
 <Activity className="h-10 w-10 text-slate-200 mb-3" />
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">No audit records found</p>
 <p className="text-[9px] text-slate-300 mt-1">Try adjusting date range or search term</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-slate-50/50">
 <TableRow className="hover:bg-transparent border-slate-100">
 <TableHead className="py-4 px-4 text-table-header text-slate-400 font-black uppercase tracking-wider">Date</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400 font-black uppercase tracking-wider">Phase</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400 text-center font-black uppercase tracking-wider">Status</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400 font-black uppercase tracking-wider">Defect Type</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400 font-black uppercase tracking-wider">Severity</TableHead>
 <TableHead className="py-4 px-4 text-table-header text-slate-400 font-black uppercase tracking-wider">Inspector</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filteredAudits.map((a, i) => {
 const isReject = a.status === "REJECT" || a.status === "FAILED";
 return (
 <TableRow key={a.id || i} className="group hover:bg-slate-50/30 transition-all duration-300 border-b border-slate-50">
 <TableCell className="py-3 px-4 text-slate-500 text-xs font-mono tabular-nums">
 {formatDate(a.createdAt)}
 </TableCell>
 <TableCell className="py-3 px-4">
 <DnaBadge status="info" className="text-[9px]">
 {a.phase || "—"}
 </DnaBadge>
 </TableCell>
 <TableCell className="py-3 px-4 text-center">
 <Badge className={`text-[8px] font-black uppercase rounded-lg px-2.5 py-1 border-none shadow-sm ${statusStyle(a.status)}`}>
 {a.status === "GOOD" ? "PASSED" : a.status === "REJECT" ? "FAILED" : a.status || "—"}
 </Badge>
 </TableCell>
 <TableCell className="py-3 px-4">
 {isReject && a.defectType ? (
 <Badge className="bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-mono rounded-lg px-2.5 py-1">
 {a.defectType}
 </Badge>
 ) : (
 <span className="text-slate-300 text-xs font-bold uppercase">—</span>
 )}
 </TableCell>
 <TableCell className="py-3 px-4">
 {a.severity ? (
 <Badge className={`text-[8px] font-black uppercase rounded-lg px-2.5 py-1 border-none ${severityStyle(a.severity)}`}>
 {a.severity}
 </Badge>
 ) : (
 <span className="text-slate-300 text-xs font-bold uppercase">—</span>
 )}
 </TableCell>
 <TableCell className="py-3 px-4 text-slate-500 text-xs font-semibold">
 {a.qc?.fullName || "—"}
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 </div>
 )}
 </TableWrapper>
 </DashboardShell>
 );
}