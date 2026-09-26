"use client";

import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  ArrowUpRight,
  FolderOpen,
  ChevronRight,
  ShieldAlert,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DnaEmptyState, DnaErrorState, DnaLoadingSkeleton } from "@/components/dna";

/**
 * GET /marketing/projects (canonical marketing) — MarketingProject with brand, owner,
 * task count, and the canonical status. This is the only project register that exists
 * in the backend; the project-control blockers/decisions model has no storage yet.
 */
interface ProjectRow {
  id: string;
  projectCode: string;
  name: string;
  channel: string;
  category: string;
  status: string;
  progress: number;
  startDate: string | null;
  deadline: string | null;
  summary: string | null;
  blockers: string | null;
  taskCount: number;
  ownerName: string;
  brandName: string | null;
  updatedAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  PLANNED: "Direncanakan",
  ON_TRACK: "On Track",
  AT_RISK: "At Risk",
  ON_HOLD: "Ditahan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
};

const STATUS_FILTERS = ["ALL", "PLANNED", "ON_TRACK", "AT_RISK", "ON_HOLD", "COMPLETED", "CANCELLED"] as const;

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

function unwrapList(payload: any): any[] {
  const list = payload?.data?.data || payload?.data || payload;
  if (Array.isArray(list)) return list;
  if (Array.isArray(list?.data)) return list.data;
  return [];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ON_TRACK: "bg-emerald-50 text-emerald-700 border-emerald-200",
    AT_RISK: "bg-amber-50 text-amber-800 border-amber-200",
    ON_HOLD: "bg-slate-100 text-slate-600 border-slate-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    PLANNED: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default function ProjectControlDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ProjectRow[]>({
    queryKey: ["marketing-projects"],
    queryFn: async () => {
      try {
        const res = await api.get("/marketing/projects", { params: { limit: 100 } });
        return unwrapList(res.data).map(
          (row: any): ProjectRow => ({
            id: row.id,
            projectCode: row.projectCode || "—",
            name: row.name || "—",
            channel: row.channel || "—",
            category: row.category || "—",
            status: row.canonicalStatus || row.status || "PLANNED",
            progress: Number(row.progress ?? 0),
            startDate: row.startDate || null,
            deadline: row.deadline || null,
            summary: row.summary || null,
            blockers: row.blockers || null,
            taskCount: Number(row._count?.tasks ?? 0),
            ownerName: row.owner?.fullName || row.owner?.name || "—",
            brandName: row.brand?.name || null,
            updatedAt: row.updatedAt,
          })
        );
      } catch {
        return [];
      }
    },
  });

  const summary = useMemo(() => {
    const active = data.filter((p) => p.status !== "COMPLETED" && p.status !== "CANCELLED");
    const avgProgress = active.length
      ? Math.round(active.reduce((acc, p) => acc + p.progress, 0) / active.length)
      : 0;
    return {
      totalActive: active.length,
      onTrack: active.filter((p) => p.status === "ON_TRACK").length,
      atRisk: active.filter((p) => p.status === "AT_RISK").length,
      onHold: active.filter((p) => p.status === "ON_HOLD").length,
      planned: active.filter((p) => p.status === "PLANNED").length,
      completed: data.filter((p) => p.status === "COMPLETED").length,
      blocked: active.filter((p) => Boolean(p.blockers?.trim())).length,
      avgProgress,
    };
  }, [data]);

  const attentionProjects = useMemo(
    () => data.filter((p) => p.status === "AT_RISK" || Boolean(p.blockers?.trim())),
    [data]
  );

  const filteredProjects = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return data
      .filter((p) => {
        const matchSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(q) ||
          p.projectCode.toLowerCase().includes(q) ||
          p.ownerName.toLowerCase().includes(q) ||
          (p.brandName || "").toLowerCase().includes(q);
        const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        const order: Record<string, number> = {
          AT_RISK: 0,
          ON_HOLD: 1,
          PLANNED: 2,
          ON_TRACK: 3,
          COMPLETED: 4,
          CANCELLED: 5,
        };
        return (order[a.status] ?? 99) - (order[b.status] ?? 99);
      });
  }, [data, searchQuery, statusFilter]);

  const onTrackPct = Math.round((summary.onTrack / (summary.totalActive || 1)) * 100);

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
        <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
          Project Control Hub
        </h1>
        <DnaLoadingSkeleton rows={6} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
        <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
          Project Control Hub
        </h1>
        <DnaErrorState
          title="Gagal Memuat Portofolio Proyek"
          message="Tidak dapat mengambil data dari /marketing/projects."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">

      {/* ── 1. HEADER ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
              Project Control Hub
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold uppercase tracking-wider">
              PORTFOLIO PROYEK
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">
            Portofolio proyek marketing yang tercatat di backend, beserta status kanonik dan blocker terakhir.
          </p>
        </div>

        <Link
          href="/master/kpi-department"
          className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-semibold flex items-center gap-2 transition-all cursor-pointer text-decoration-none shadow-2xs"
        >
          <span>Ke KPI Management Suite</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── 2. KPI CARDS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Status Eksekusi Proyek</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FolderOpen className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-slate-900 leading-tight">{summary.totalActive}</h3>
              <span className="text-[13px] font-bold text-slate-500">Proyek Aktif</span>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-600">On Track: {summary.onTrack}</span>
                <span className="text-slate-700">{onTrackPct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${onTrackPct}%` }} className="bg-emerald-500 h-full rounded-full transition-all" />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>⚡ {summary.atRisk} At Risk</span>
            <span>🕒 {summary.onHold} On Hold</span>
            <span>📋 {summary.planned} Planned</span>
          </div>
        </div>

        <div className={cn(
          "bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3",
          summary.blocked > 0 ? "border-purple-300 bg-purple-50/20" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider">Blocker Tercatat</span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-purple-950 leading-tight">{summary.blocked}</h3>
              <span className="text-[12px] font-bold text-purple-700">Proyek Terhambat</span>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-700">
                <span>Diambil dari catatan blocker proyek</span>
                <span>{summary.blocked} Proyek</span>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.round((summary.blocked / (summary.totalActive || 1)) * 100)}%` }}
                  className="bg-purple-600 h-full rounded-full"
                />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-purple-100 text-[11px] font-semibold text-purple-800 truncate">
            {summary.blocked > 0
              ? `📌 ${attentionProjects.find((p) => p.blockers?.trim())?.name || "Lihat tabel perhatian"}`
              : "Tidak ada blocker tercatat"}
          </div>
        </div>

        <div className={cn(
          "bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3",
          summary.atRisk > 0 ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">At Risk</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-rose-950 leading-tight">{summary.atRisk}</h3>
              <span className="text-[12px] font-bold text-rose-700">Proyek Berisiko</span>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
                <span>canonicalStatus = AT_RISK</span>
                <span>{Math.round((summary.atRisk / (summary.totalActive || 1)) * 100)}% dari aktif</span>
              </div>
              <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.round((summary.atRisk / (summary.totalActive || 1)) * 100)}%` }}
                  className="bg-rose-600 h-full"
                />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-rose-100 text-[11px] font-semibold text-rose-800 truncate">
            {summary.atRisk > 0
              ? `⚠️ ${data.filter((p) => p.status === "AT_RISK").map((p) => p.name).slice(0, 2).join(" & ")}`
              : "Tidak ada proyek berisiko"}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Milestone Achievement</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-slate-900 leading-tight">{summary.completed}</h3>
              <span className="text-[12px] font-bold text-emerald-700">Proyek Selesai</span>
            </div>
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span>Rata-Rata Progress Portofolio Aktif</span>
                <span>{summary.avgProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${summary.avgProgress}%` }} className="bg-emerald-500 h-full rounded-full" />
              </div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 truncate">
            {data.length} proyek tercatat di register
          </div>
        </div>

      </div>

      {/* ── 3. ATTENTION TABLE ── */}
      {attentionProjects.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-[14px] font-extrabold text-slate-900 uppercase tracking-wide">
                Perlu Perhatian (At Risk / Blocker)
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
              {attentionProjects.length} Proyek
            </span>
          </div>

          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-rose-50/40 border-b border-rose-100 text-[11px] font-bold text-slate-700 uppercase">
                  <DnaTh className="py-2.5 px-3">Proyek</DnaTh>
                  <DnaTh className="py-2.5 px-3">Status</DnaTh>
                  <DnaTh className="py-2.5 px-3">Blocker Tercatat</DnaTh>
                  <DnaTh className="py-2.5 px-3">Owner</DnaTh>
                  <DnaTh className="py-2.5 px-3">Deadline</DnaTh>
                  <DnaTh className="py-2.5 px-3 text-right">Detail</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {attentionProjects.map((proj) => (
                  <DnaTableRow key={proj.id} className="hover:bg-rose-50/30 transition-colors">
                    <DnaTd className="py-2.5 px-3 font-bold text-slate-900">
                      <Link href={`/samples/project-control/${proj.id}`} className="hover:text-blue-600 transition-colors">
                        {proj.name}
                      </Link>
                      <span className="block text-[11px] font-normal text-slate-500">{proj.channel}</span>
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3">
                      <StatusBadge status={proj.status} />
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3">
                      {proj.blockers?.trim() ? (
                        <span className="text-rose-700 text-[12px] font-medium">{proj.blockers}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[12px]">Tidak ada blocker tercatat</span>
                      )}
                    </DnaTd>
                    <DnaTd className="py-2.5 px-3 font-medium text-slate-700">{proj.ownerName}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-slate-600 tabular-nums text-[12px]">{formatDate(proj.deadline)}</DnaTd>
                    <DnaTd className="py-2.5 px-3 text-right">
                      <Link
                        href={`/samples/project-control/${proj.id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer text-decoration-none shadow-2xs"
                      >
                        <span>Lihat Detail</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </DnaTd>
                  </DnaTableRow>
                ))}
              </DnaTableBody>
            </DnaTable>
          </div>
        </div>
      )}

      {/* ── 4. FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari proyek, kode, owner..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "Semua Status" : STATUS_LABEL[s] || s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── 5. PORTFOLIO TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-500" /> Portfolio Proyek
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Menampilkan {filteredProjects.length} Proyek</span>
        </div>

        {data.length === 0 ? (
          <div className="p-6">
            <DnaEmptyState
              title="Belum Ada Proyek Tercatat"
              description="Register proyek marketing (/marketing/projects) masih kosong. Project Control tidak menampilkan data contoh."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DnaTable>
              <DnaTableHead>
                <DnaTableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <DnaTh className="px-4 py-3">Kode / Nama Proyek</DnaTh>
                  <DnaTh className="px-4 py-3">Channel</DnaTh>
                  <DnaTh className="px-4 py-3">Brand / Owner</DnaTh>
                  <DnaTh className="px-4 py-3">Progress</DnaTh>
                  <DnaTh className="px-4 py-3">Tasks</DnaTh>
                  <DnaTh className="px-4 py-3">Status</DnaTh>
                  <DnaTh className="px-4 py-3">Deadline</DnaTh>
                  <DnaTh className="px-4 py-3 text-right">Update Terakhir</DnaTh>
                </DnaTableRow>
              </DnaTableHead>
              <DnaTableBody>
                {filteredProjects.length === 0 ? (
                  <DnaTableRow>
                    <DnaTd colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada proyek yang sesuai filter.
                    </DnaTd>
                  </DnaTableRow>
                ) : (
                  filteredProjects.map((proj) => (
                    <DnaTableRow key={proj.id} className="hover:bg-slate-50/60 transition-colors group">
                      <DnaTd className="px-4 py-3 font-bold text-slate-900">
                        <Link href={`/samples/project-control/${proj.id}`} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                          <span>{proj.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                        </Link>
                        <span className="block text-[11px] font-normal text-slate-500 tabular-nums">{proj.projectCode}</span>
                      </DnaTd>

                      <DnaTd className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {proj.channel}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">{proj.category}</span>
                      </DnaTd>

                      <DnaTd className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">{proj.brandName || "—"}</span>
                        <span className="text-[11px] text-slate-500">Owner: {proj.ownerName}</span>
                      </DnaTd>

                      <DnaTd className="px-4 py-3 w-32">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                proj.progress >= 80 ? "bg-emerald-500" : proj.progress >= 50 ? "bg-blue-500" : "bg-amber-500"
                              )}
                              style={{ width: `${proj.progress}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold tabular-nums text-slate-800">{proj.progress}%</span>
                        </div>
                      </DnaTd>

                      <DnaTd className="px-4 py-3">
                        <span className="tabular-nums font-bold text-slate-800">{proj.taskCount}</span>
                        <FileText className="w-3.5 h-3.5 text-slate-400 inline ml-1" />
                      </DnaTd>

                      <DnaTd className="px-4 py-3">
                        <StatusBadge status={proj.status} />
                      </DnaTd>

                      <DnaTd className="px-4 py-3 text-[12px] tabular-nums text-slate-600">
                        {formatDate(proj.deadline)}
                        <span className="block text-[10px] text-slate-400">Mulai: {formatDate(proj.startDate)}</span>
                      </DnaTd>

                      <DnaTd className="px-4 py-3 text-right text-[11px] tabular-nums text-slate-500">
                        {formatDate(proj.updatedAt)}
                      </DnaTd>
                    </DnaTableRow>
                  ))
                )}
              </DnaTableBody>
            </DnaTable>
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[12px] text-amber-900">
        <strong className="block mb-1">Catatan cakupan data</strong>
        Halaman ini menampilkan register proyek yang benar-benar ada di backend
        (<code className="font-mono">/marketing/projects</code>): kode proyek, nama, channel,
        kategori, brand, owner, progress, jumlah task, status kanonik, tanggal mulai/deadline,
        dan catatan blocker. Model milestone, keputusan Direksi, dan tingkat keparahan blocker
        yang sebelumnya ditampilkan sebagai contoh tidak memiliki penyimpanan di backend sehingga
        tidak lagi ditampilkan.
      </div>

    </div>
  );
}