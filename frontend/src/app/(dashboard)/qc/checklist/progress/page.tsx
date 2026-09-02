"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  ListChecks,
  Timer,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QueryLoading, QueryError } from "@/components/query-states";
import { StatCard, KpiCard, DnaInput, TableWrapper, DnaBadge } from "@/components/dna";

interface ChecklistProgress {
  id: string;
  code: string;
  category: string;
  name: string;
  pic: string;
  progress: number;
  status: string;
  deadline: string;
  totalItems: number;
  completedItems: number;
}

function ProgressBar({ value }: { value: number }) {
  const color =
    value >= 80
      ? "bg-emerald-500"
      : value >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className={cn(
        "text-[10px] font-black tabular-nums w-10 text-right",
        value >= 80 ? "text-emerald-600" : value >= 50 ? "text-amber-600" : "text-rose-600"
      )}>
        {value}%
      </span>
    </div>
  );
}

function getStatusBadge(status: string): "success" | "warning" | "critical" | "info" | "default" {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
    case "DONE":
    case "VERIFIED": return "success";
    case "IN_PROGRESS":
    case "ACTIVE": return "info";
    case "OVERDUE":
    case "DELAYED": return "critical";
    case "PENDING":
    case "NOT_STARTED": return "warning";
    default: return "default";
  }
}

export default function ChecklistProgressPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const { data: checklists, isLoading, isError } = useQuery<ChecklistProgress[]>({
    queryKey: ["qc-checklist-progress"],
    queryFn: async () => {
      const res = await api.get("/qc/checklists");
      return (res.data || []).map((c: any) => ({
        id: c.id,
        code: c.code || c.id,
        category: c.category || "General",
        name: c.name || c.title || "Unnamed",
        pic: c.pic || c.assignedTo || "—",
        progress: c.progress ?? 0,
        status: c.status || "PENDING",
        deadline: c.deadline || c.dueDate || null,
        totalItems: c.totalItems || 0,
        completedItems: c.completedItems || 0,
      }));
    },
  });

  const filtered = checklists?.filter((c) => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.pic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || c.category === filterCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const categories = ["all", ...new Set(checklists?.map((c) => c.category) || [])];

  const totalChecklists = checklists?.length || 0;
  const avgProgress = totalChecklists > 0
    ? Math.round(checklists!.reduce((s, c) => s + c.progress, 0) / totalChecklists)
    : 0;
  const completedCount = checklists?.filter((c) => c.progress === 100).length || 0;
  const overdueCount = checklists?.filter((c) => c.status === "OVERDUE" || (c.deadline && new Date(c.deadline) < new Date() && c.progress < 100)).length || 0;

  return (
    <DashboardShell
      title="Checklist"
      titleAccent="Progress"
      subtitle="Monitoring progres seluruh checklist QC aktif"
    >
      {isLoading ? (
        <QueryLoading message="Memuat data checklist..." />
      ) : isError ? (
        <QueryError error="Gagal memuat data" onRetry={() => window.location.reload()} />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard icon={<ListChecks className="text-blue-600" />} label="Total Checklist" value={totalChecklists} />
            <KpiCard icon={<Target />} label="Rata-rata Progres" value={`${avgProgress}%`} targetPct={avgProgress} />
            <StatCard icon={<CheckCircle2 className="text-emerald-500" />} label="Selesai" value={completedCount} />
            <StatCard icon={<AlertTriangle className="text-rose-500" />} label="Terlambat" value={overdueCount} />
          </div>

          <TableWrapper
            filters={
              <div className="flex items-center gap-3 w-full justify-between">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                    Semua Checklist Aktif
                  </h3>
                  <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tight mt-0.5">
                    Progress real-time • {filtered.length} Items
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-tight text-slate-600 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/5 transition-all"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === "all" ? "Semua Kategori" : cat}
                      </option>
                    ))}
                  </select>
                  <div className="relative w-64">
                    <DnaInput
                      icon={<Search className="h-4 w-4" />}
                      placeholder="Cari checklist..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            }
          >
            <Table className="table-dense">
              <TableHeader className="bg-slate-50/70">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="py-4 pl-6 text-left font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Kode
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Kategori
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Nama Checklist
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    PIC
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] min-w-[200px]">
                    Progress
                  </TableHead>
                  <TableHead className="font-black text-slate-400 uppercase tracking-tight text-[9px] text-center">
                    Status
                  </TableHead>
                  <TableHead className="pr-6 text-right font-black text-slate-400 uppercase tracking-tight text-[9px]">
                    Deadline
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className="group hover:bg-slate-50/50 transition-all duration-300 border-b border-slate-50"
                  >
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <ClipboardCheck className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tight text-xs uppercase italic">
                          {item.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <DnaBadge status="default">{item.category}</DnaBadge>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="font-black text-slate-900 text-xs">{item.name}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                          {item.pic?.charAt(0) || "?"}
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{item.pic}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 min-w-[200px]">
                      <div className="space-y-1">
                        <ProgressBar value={item.progress} />
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                          {item.completedItems}/{item.totalItems} Items
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-center">
                      <DnaBadge status={getStatusBadge(item.status)}>
                        {item.status}
                      </DnaBadge>
                    </TableCell>
                    <TableCell className="py-3 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="h-3 w-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-500">
                          {item.deadline
                            ? new Date(item.deadline).toLocaleDateString("id-ID")
                            : "—"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <ClipboardCheck className="h-12 w-12 text-slate-200 mb-3" />
                        <p className="text-sm font-black italic text-slate-400 uppercase tracking-wider">
                          Tidak Ada Checklist Ditemukan
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                          Semua checklist sudah selesai atau belum ada data
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableWrapper>
        </>
      )}
    </DashboardShell>
  );
}
