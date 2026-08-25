"use client";

import React, { useState } from "react";
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
  Trash2,
  CheckCheck,
  Shield,
  Zap,
  Package,
  Users,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OperationalMigrationShell } from "@/components/operational/OperationalMigrationShell";
import { formatOperationalDate } from "@/lib/operational-formatters";
import { QueryLoading, QueryError } from "@/components/query-states";
import { StatCard, DnaInput, DnaButton, TableWrapper, DnaBadge } from "@/components/dna";

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
  { icon: typeof AlertTriangle; color: string; bg: string; badge: "critical" | "warning" | "info" }
> = {
  CRITICAL: {
    icon: AlertTriangle,
    color: "text-rose-600",
    bg: "bg-rose-50 border-rose-100",
    badge: "critical",
  },
  WARNING: {
    icon: AlertCircle,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
    badge: "warning",
  },
  INFO: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
    badge: "info",
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
    <OperationalMigrationShell
      title="Notifikasi Operasional"
      subtitle="Pusat notifikasi & alert seluruh divisi"
      actions={
        <div className="flex gap-3">
          <DnaButton
            variant="outline"
            icon={<CheckCheck />}
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0}
          >
            Tandai Semua Dibaca
          </DnaButton>
        </div>
      }
    >
      {isLoading ? (
        <QueryLoading message="Memuat notifikasi..." />
      ) : isError ? (
        <QueryError error="Gagal memuat notifikasi" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<Bell className="text-blue-600" />} label="Total Notifikasi" value={totalNotifications} />
            <StatCard icon={<Eye className="text-purple-600" />} label="Belum Dibaca" value={unreadCount} />
            <StatCard icon={<AlertTriangle className="text-rose-600" />} label="Kritis" value={criticalCount} />
            <StatCard icon={<AlertCircle className="text-amber-600" />} label="Peringatan" value={warningCount} />
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penyaring</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DnaInput
                icon={<Search className="h-4 w-4" />}
                placeholder="Cari notifikasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-tight text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/5 transition-all"
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
                className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-tight text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/5 transition-all"
              >
                <option value="all">Semua Tingkat</option>
                <option value="CRITICAL">Kritis</option>
                <option value="WARNING">Peringatan</option>
                <option value="INFO">Info</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filtered.map((notif) => {
              const config = SEVERITY_CONFIG[notif.severity] || SEVERITY_CONFIG.INFO;
              const SeverityIcon = config.icon;
              const DivIcon = DIVISION_ICONS[notif.division] || Bell;

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "bg-white border rounded-xl p-4 transition-colors group",
                    notif.isRead ? "border-[var(--border-color)]" : config.bg,
                    !notif.isRead && "ring-1 ring-inset ring-current/5"
                  )}
                >
                  <div className="flex items-start gap-5">
                    {/* Severity Icon */}
                    <div className={cn("p-3 rounded-2xl border shrink-0", config.bg)}>
                      <SeverityIcon className={cn("h-5 w-5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3
                              className={cn(
                                "font-black text-sm tracking-tight",
                                notif.isRead ? "text-slate-600" : "text-slate-900"
                              )}
                            >
                              {notif.title}
                            </h3>
                            {!notif.isRead && (
                              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{notif.message}</p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <DnaBadge status={config.badge}>{SEVERITY_LABELS[notif.severity] || notif.severity}</DnaBadge>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <DivIcon className="h-3 w-3 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400">{notif.division === "System" ? "Sistem" : notif.division}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-300" />
                          <span className="text-[9px] font-bold text-slate-400">
                            {formatOperationalDate(notif.date, {
                              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {!notif.isRead && (
                          <DnaButton
                            variant="ghost"
                            size="sm"
                            icon={<CheckCircle2 />}
                            onClick={() => markReadMutation.mutate(notif.id)}
                            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Tandai Dibaca
                          </DnaButton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-20 text-center">
                <div className="flex flex-col items-center justify-center">
                  <Bell className="h-12 w-12 text-slate-200 mb-3" />
                  <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">
                    Tidak Ada Notifikasi
                  </p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                    Semua sudah terbaca atau belum ada data baru
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </OperationalMigrationShell>
  );
}
