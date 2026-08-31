"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
 Search,
 Download,
 Calendar,
 ClipboardCheck,
 CheckCircle2,
 Clock,
 ArrowRight,
 Filter,
 Users,
 FileText,
 History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OperationalMigrationShell, OperationalMetricCard, OperationalMetricGrid } from "@/components/operational";
import { QueryLoading, QueryError } from "@/components/query-states";
import { DnaInput, DnaButton, DnaBadge } from "@/components/dna";

interface ChecklistTracking {
 id: string;
 code: string;
 category: string;
 name: string;
 pic: string;
 completedAt: string;
 duration: string;
 status: string;
 verifiedBy: string;
 totalItems: number;
 passedItems: number;
}

function TimelineDot({ status }: { status: string }) {
 const color =
 status === "VERIFIED"
 ? "bg-emerald-500"
 : status === "COMPLETED"
 ? "bg-blue-500"
 : "bg-amber-500";

 return (
 <div className="relative flex items-center justify-center">
 <div className={cn("h-4 w-4 rounded-full border-2 border-white z-10", color)} />
 <div className={cn("absolute h-8 w-8 rounded-full opacity-20 animate-ping", color)} />
 </div>
 );
}

export default function ChecklistTrackingPage() {
 const [searchTerm, setSearchTerm] = useState("");
 const [dateFrom, setDateFrom] = useState(
 new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0]
 );
 const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
 const [filterCategory, setFilterCategory] = useState("all");
 const [filterPIC, setFilterPIC] = useState("all");

 const { data: tracked, isLoading, isError } = useQuery<ChecklistTracking[]>({
 queryKey: ["qc-checklist-tracking", dateFrom, dateTo],
 queryFn: async () => {
 const res = await api.get("/qc/checklists/completed", {
 params: { from: dateFrom, to: dateTo },
 });
 return (res.data || []).map((c: any) => ({
 id: c.id,
 code: c.code || c.id,
 category: c.category || "General",
 name: c.name || c.title || "Unnamed",
 pic: c.pic || c.assignedTo || "—",
 completedAt: c.completedAt || c.updatedAt || c.createdAt,
 duration: c.duration || "—",
 status: c.status || "COMPLETED",
 verifiedBy: c.verifiedBy || c.approvedBy || "—",
 totalItems: c.totalItems || 0,
 passedItems: c.passedItems || c.completedItems || 0,
 }));
 },
 });

 const filtered = tracked?.filter((t) => {
 const matchSearch =
 t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
 t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 t.pic.toLowerCase().includes(searchTerm.toLowerCase());
 const matchCat = filterCategory === "all" || t.category === filterCategory;
 const matchPic = filterPIC === "all" || t.pic === filterPIC;
 return matchSearch && matchCat && matchPic;
 }) || [];

 const categories = ["all", ...new Set(tracked?.map((t) => t.category) || [])];
 const pics = ["all", ...new Set(tracked?.map((t) => t.pic) || [])];

 const totalCompleted = tracked?.length || 0;
 const verifiedCount = tracked?.filter((t) => t.status === "VERIFIED").length || 0;
 const avgPassRate = totalCompleted > 0
 ? Math.round(tracked!.reduce((s, t) => s + (t.totalItems > 0 ? (t.passedItems / t.totalItems) * 100 : 0), 0) / totalCompleted)
 : 0;

 return (
 <OperationalMigrationShell
 title="Checklist"
 titleAccent="Tracking"
 subtitle="Timeline penyelesaian checklist & verifikasi kualitas"
 actions={
 <div className="flex gap-3">
 <DnaButton variant="outline" icon={<Download />}>
 Export
 </DnaButton>
 </div>
 }
 >
 {isLoading ? (
 <QueryLoading message="Memuat data tracking..." />
 ) : isError ? (
 <QueryError error="Gagal memuat data" onRetry={() => window.location.reload()} />
 ) : (
 <>
 <OperationalMetricGrid>
 <OperationalMetricCard
 icon={<ClipboardCheck className="h-4 w-4" />}
 label="Total Selesai"
 value={totalCompleted}
 tone="blue"
 />
 <OperationalMetricCard
 icon={<CheckCircle2 className="h-4 w-4" />}
 label="Terverifikasi"
 value={verifiedCount}
 tone="green"
 />
 <OperationalMetricCard
 icon={<Users className="h-4 w-4" />}
 label="PIC Aktif"
 value={Math.max(pics.length - 1, 0)}
 tone="purple"
 />
 <OperationalMetricCard
 icon={<History className="h-4 w-4" />}
 label="Rata-rata Pass Rate"
 value={`${avgPassRate}%`}
 tone="amber"
 />
 </OperationalMetricGrid>

 {/* Filters */}
 <div className="bg-white border border-[var(--border-color)] rounded-[24px] p-6 shadow-sm space-y-4">
 <div className="flex items-center gap-2 mb-4">
 <Filter className="h-4 w-4 text-slate-400" />
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter & Search</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Dari</label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
 <input
 type="date"
 value={dateFrom}
 onChange={(e) => setDateFrom(e.target.value)}
 className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sampai</label>
 <div className="relative">
 <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
 <input
 type="date"
 value={dateTo}
 onChange={(e) => setDateTo(e.target.value)}
 className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 focus:ring-2 focus:ring-blue-500/5 focus:border-blue-500 transition-all"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Kategori</label>
 <select
 value={filterCategory}
 onChange={(e) => setFilterCategory(e.target.value)}
 className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/5 transition-all"
 >
 {categories.map((c) => (
 <option key={c} value={c}>
 {c === "all" ? "Semua Kategori" : c}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">PIC</label>
 <select
 value={filterPIC}
 onChange={(e) => setFilterPIC(e.target.value)}
 className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-700 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/5 transition-all"
 >
 {pics.map((p) => (
 <option key={p} value={p}>
 {p === "all" ? "Semua PIC" : p}
 </option>
 ))}
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Search</label>
 <DnaInput
 icon={<Search className="h-4 w-4" />}
 placeholder="Cari..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="h-10 text-[11px]"
 />
 </div>
 </div>
 </div>

 {/* Timeline View */}
 <div className="space-y-1">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-3 bg-blue-600 rounded-xl">
 <History className="h-5 w-5 text-white" />
 </div>
 <div>
 <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
 Timeline Penyelesaian
 </h3>
 <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
 {filtered.length} Checklist Selesai
 </p>
 </div>
 </div>

 <div className="relative">
 {/* Vertical Line */}
 <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />

 <div className="space-y-6">
 {filtered.map((item, idx) => (
 <div key={item.id} className="relative flex gap-6 group">
 {/* Timeline Dot */}
 <div className="relative z-10 flex-shrink-0 mt-1">
 <TimelineDot status={item.status} />
 </div>

 {/* Content Card */}
 <div className="flex-1 bg-white border border-[var(--border-color)] rounded-[24px] p-6 shadow-sm group-hover: transition-all">
 <div className="flex items-start justify-between">
 <div className="space-y-3">
 <div className="flex items-center gap-3">
 <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
 <ClipboardCheck className="h-4 w-4 text-blue-500" />
 </div>
 <div>
 <p className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
 {item.code}
 </p>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
 {item.category}
 </p>
 </div>
 </div>
 <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
 <div className="flex items-center gap-4 text-[10px] text-slate-400">
 <div className="flex items-center gap-1.5">
 <Users className="h-3 w-3" />
 <span className="font-bold uppercase">{item.pic}</span>
 </div>
 {item.verifiedBy !== "—" && (
 <div className="flex items-center gap-1.5">
 <CheckCircle2 className="h-3 w-3 text-emerald-500" />
 <span className="font-bold uppercase">Verified by {item.verifiedBy}</span>
 </div>
 )}
 </div>
 </div>
 <div className="text-right space-y-2">
 <DnaBadge status={item.status === "VERIFIED" ? "success" : "info"}>
 {item.status}
 </DnaBadge>
 <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
 <Clock className="h-3 w-3" />
 <span className="font-medium">
 {item.completedAt
 ? new Date(item.completedAt).toLocaleDateString("id-ID", {
 day: "numeric",
 month: "short",
 year: "numeric",
 })
 : "—"}
 </span>
 </div>
 {item.duration !== "—" && (
 <p className="text-[9px] font-bold text-slate-300 uppercase">
 Durasi: {item.duration}
 </p>
 )}
 </div>
 </div>

 {/* Pass Rate Bar */}
 {item.totalItems > 0 && (
 <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-3">
 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Pass Rate</span>
 <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div
 className={cn(
 "h-full rounded-full",
 (item.passedItems / item.totalItems) * 100 >= 80 ? "bg-emerald-500" : "bg-amber-500"
 )}
 style={{ width: `${(item.passedItems / item.totalItems) * 100}%` }}
 />
 </div>
 <span className="text-[10px] font-black text-slate-600 tabular-nums">
 {item.passedItems}/{item.totalItems}
 </span>
 </div>
 )}
 </div>
 </div>
 ))}

 {filtered.length === 0 && (
 <div className="ml-14 py-16 text-center">
 <div className="flex flex-col items-center justify-center">
 <History className="h-12 w-12 text-slate-200 mb-3" />
 <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">
 Tidak Ada Data Tracking
 </p>
 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
 Belum ada checklist selesai dalam periode ini
 </p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 </>
 )}
 </OperationalMigrationShell>
 );
}
