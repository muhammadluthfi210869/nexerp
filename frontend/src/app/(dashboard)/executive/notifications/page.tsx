"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
 Search,
 Bell,
 AlertTriangle,
 AlertCircle,
 Info,
 CheckCircle2,
 Clock,
 Filter,
 Eye,
 CheckCheck,
 Shield,
 Zap,
 Package,
 Users,
 BarChart3,
 Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
 PageShell,
 CanonicalMetricGrid,
 MetricCard,
 SectionCard,
 SectionCardContent,
 StatusBadge,
 EmptyState,
} from "@/components/canonical";
import { formatOperationalDate } from "@/lib/operational-formatters";
import { QueryLoading, QueryError } from "@/components/query-states";

interface Notification {
 id: string;
 title: string;
 message: string;
 division: string;
 severity: "CRITICAL" | "WARNING" | "INFO";
 date: string;
 isRead: boolean;
 source: string;
 actionUrl?: string;
}

const SEVERITY_CONFIG: Record<
 string,
 { icon: typeof AlertTriangle; color: string; bg: string; variant: "destructive" | "warning" | "info" }
> = {
 CRITICAL: {
 icon: AlertTriangle,
 color: "text-rose-600",
 bg: "bg-rose-50 border-rose-100",
 variant: "destructive",
 },
 WARNING: {
 icon: AlertCircle,
 color: "text-amber-600",
 bg: "bg-amber-50 border-amber-100",
 variant: "warning",
 },
 INFO: {
 icon: Info,
 color: "text-blue-600",
 bg: "bg-blue-50 border-blue-100",
 variant: "info",
 },
};

const DIVISION_ICONS: Record<string, typeof Package> = {
 Production: Package,
 QC: Shield,
 Finance: BarChart3,
 HR: Users,
 Warehouse: Package,
 Logistics: Package,
 "R&D": Zap,
 Legal: Shield,
 System: Settings,
};

const SEVERITY_LABELS: Record<string, string> = {
 CRITICAL: "Kritis",
 WARNING: "Peringatan",
 INFO: "Info",
};

export default function NotificationsPage() {
 const queryClient = useQueryClient();
 const [searchTerm, setSearchTerm] = useState("");
 const [filterDivision, setFilterDivision] = useState("all");
 const [filterSeverity, setFilterSeverity] = useState("all");

 const {
 data: notifications,
 isLoading,
 isError,
 } = useQuery<Notification[]>({
 queryKey: ["executive-notifications"],
 queryFn: async () => {
 const res = await api.get("/notifications");
 return (res.data || []).map((n: any) => ({
 id: n.id,
 title: n.title || n.subject || "Notification",
 message: n.message || n.body || n.description || "",
 division: n.division || n.module || "System",
 severity: n.severity || n.priority || n.type || "INFO",
 date: n.createdAt || n.date || new Date().toISOString(),
 isRead: n.isRead || n.read || false,
 source: n.source || n.module || "System",
 actionUrl: n.actionUrl,
 }));
 },
 });

 const markReadMutation = useMutation({
 mutationFn: async (id: string) => {
 return api.post(`/notifications/${id}/read`);
 },
 onSuccess: () => {
 queryClient.invalidateQueries({ queryKey: ["executive-notifications"] });
 },
 });

 const markAllReadMutation = useMutation({
 mutationFn: async () => {
 return api.post("/notifications/read-all");
 },
 onSuccess: () => {
 toast.success("Semua notifikasi ditandai sudah dibaca");
 queryClient.invalidateQueries({ queryKey: ["executive-notifications"] });
 },
 });

 const filtered = notifications?.filter((n) => {
 const matchSearch =
 n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
 n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
 n.division.toLowerCase().includes(searchTerm.toLowerCase());
 const matchDiv = filterDivision === "all" || n.division === filterDivision;
 const matchSev = filterSeverity === "all" || n.severity === filterSeverity;
 return matchSearch && matchDiv && matchSev;
 }) || [];

 const divisions = ["all", ...new Set(notifications?.map((n) => n.division) || [])];

 const totalNotifications = notifications?.length || 0;
 const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;
 const criticalCount = notifications?.filter((n) => n.severity === "CRITICAL").length || 0;
 const warningCount = notifications?.filter((n) => n.severity === "WARNING").length || 0;

 return (
 <PageShell
 title="Notifikasi Operasional"
 subtitle="Pusat notifikasi & alert seluruh divisi"
 actions={
 <button
 type="button"
 onClick={() => markAllReadMutation.mutate()}
 disabled={unreadCount === 0}
 className="h-10 px-4 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
 >
 <CheckCheck className="h-4 w-4" />
 Tandai Semua Dibaca
 </button>
 }
 >
 {isLoading ? (
 <QueryLoading message="Memuat notifikasi..." />
 ) : isError ? (
 <QueryError error="Gagal memuat notifikasi" onRetry={() => window.location.reload()} />
 ) : (
 <>
 <CanonicalMetricGrid>
 <MetricCard label="Total Notifikasi" value={totalNotifications} icon={<Bell />} variant="info" />
 <MetricCard label="Belum Dibaca" value={unreadCount} icon={<Eye />} variant="warning" />
 <MetricCard label="Kritis" value={criticalCount} icon={<AlertTriangle />} variant="danger" />
 <MetricCard label="Peringatan" value={warningCount} icon={<AlertCircle />} variant="warning" />
 </CanonicalMetricGrid>

 <SectionCard>
 <SectionCardContent>
 <div className="flex items-center gap-2 mb-4">
 <Filter className="h-4 w-4 text-slate-400" />
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penyaring</span>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400">
 <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
 <input
 type="search"
 placeholder="Cari notifikasi..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
 />
 </label>
 <select
 value={filterDivision}
 onChange={(e) => setFilterDivision(e.target.value)}
 className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 >
 {divisions.map((d) => (
 <option key={d} value={d}>
 {d === "all" ? "Semua Divisi" : d}
 </option>
 ))}
 </select>
 <select
 value={filterSeverity}
 onChange={(e) => setFilterSeverity(e.target.value)}
 className="h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
 >
 <option value="all">Semua Tingkat</option>
 <option value="CRITICAL">Kritis</option>
 <option value="WARNING">Peringatan</option>
 <option value="INFO">Info</option>
 </select>
 </div>
 </SectionCardContent>
 </SectionCard>

 <div className="flex flex-col gap-3">
 {filtered.length === 0 ? (
 <EmptyState
 icon={<Bell className="h-8 w-8 text-slate-300" />}
 title="Tidak Ada Notifikasi"
 description="Semua sudah terbaca atau belum ada data baru."
 />
 ) : (
 filtered.map((notif) => {
 const config = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.INFO;
 const SeverityIcon = config.icon;
 const DivIcon = DIVISION_ICONS[notif.division] || Bell;

 return (
 <div
 key={notif.id}
 className={cn(
 "rounded-[12px] border bg-white border-[#E2E8F0] p-4 transition-colors group",
 !notif.isRead && config.bg,
 )}
 >
 <div className="flex items-start gap-5">
 <div className={cn("p-3 rounded-lg border shrink-0", config.bg)}>
 <SeverityIcon className={cn("h-5 w-5", config.color)} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-1.5">
 <div className="flex items-center gap-2">
 <h3
 className={cn(
 "font-semibold text-[14px] tracking-tight",
 notif.isRead ? "text-slate-600" : "text-slate-900"
 )}
 >
 {notif.title}
 </h3>
 {!notif.isRead && (
 <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
 )}
 </div>
 <p className="text-[12px] text-slate-500 leading-relaxed">{notif.message}</p>
 </div>

 <div className="flex items-center gap-3 shrink-0">
 <StatusBadge variant={config.variant}>
 {SEVERITY_LABELS[notif.severity] || notif.severity}
 </StatusBadge>
 </div>
 </div>

 <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
 <div className="flex items-center gap-1.5">
 <DivIcon className="h-3 w-3 text-slate-400" />
 <span className="text-[10px] font-medium text-slate-500">{notif.division === "System" ? "Sistem" : notif.division}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Clock className="h-3 w-3 text-slate-400" />
 <span className="text-[10px] font-medium text-slate-500">
 {formatOperationalDate(notif.date, {
 day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
 })}
 </span>
 </div>
 {!notif.isRead && (
 <button
 type="button"
 onClick={() => markReadMutation.mutate(notif.id)}
 className="ml-auto inline-flex items-center gap-1 h-7 px-2 rounded-md text-[11px] font-medium text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"
 >
 <CheckCircle2 className="h-3 w-3" />
 Tandai Dibaca
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>
 </>
 )}
 </PageShell>
 );
}
