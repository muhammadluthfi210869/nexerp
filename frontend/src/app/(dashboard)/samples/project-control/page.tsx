"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  FileText,
  Filter,
  ArrowUpRight,
  FolderOpen,
  UserCheck,
  ChevronRight,
  Layers,
  Sparkles,
  Calendar,
  ShieldAlert,
  Zap,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_PROJECTS } from "@/components/project-control/mock-data";
import { ProjectStatusBadge } from "@/components/project-control/ProjectControlComponents";
import { Project } from "@/types/project-control";

export default function ProjectControlDashboardPage() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  // Summary Metrics
  const summary = useMemo(() => {
    const active = projects.filter(p => p.status !== "DONE" && p.status !== "CANCELLED");
    return {
      totalActive: active.length,
      onTrack: active.filter(p => p.status === "ON_TRACK").length,
      atRisk: active.filter(p => p.status === "AT_RISK").length,
      offTrack: active.filter(p => p.status === "OFF_TRACK").length,
      notUpdated: active.filter(p => p.status === "NOT_UPDATED").length,
      needDecision: active.filter(p => p.decisionRequired).length,
      completedThisMonth: projects.filter(p => p.status === "DONE").length,
    };
  }, [projects]);

  // Projects needing immediate Director attention
  const attentionProjects = useMemo(() => {
    return projects.filter(p => p.decisionRequired || p.status === "OFF_TRACK" || p.status === "AT_RISK")
      .sort((a, b) => {
        if (a.decisionRequired && !b.decisionRequired) return -1;
        if (!a.decisionRequired && b.decisionRequired) return 1;
        if (a.status === "OFF_TRACK" && b.status !== "OFF_TRACK") return -1;
        return 0;
      });
  }, [projects]);

  // Filtered & Sorted Portfolio Table (Director Default Priority Sort)
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.pic.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter || (statusFilter === "NEED_DECISION" && p.decisionRequired);
      const matchDept = deptFilter === "ALL" || p.department === deptFilter;

      return matchSearch && matchStatus && matchDept;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        NEED_DECISION: 0,
        OFF_TRACK: 1,
        AT_RISK: 2,
        NOT_UPDATED: 3,
        ON_TRACK: 4,
        DONE: 5,
      };

      const scoreA = a.decisionRequired ? 0 : (priorityOrder[a.status] ?? 99);
      const scoreB = b.decisionRequired ? 0 : (priorityOrder[b.status] ?? 99);
      return scoreA - scoreB;
    });
  }, [projects, searchQuery, statusFilter, deptFilter]);

  const onTrackPct = Math.round((summary.onTrack / (summary.totalActive || 1)) * 100);

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">

      {/* ── 1. HEADER (UN-BOXED POLICY) ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
              Project Control Hub
            </h1>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[11px] font-bold uppercase tracking-wider">
              EXECUTIVE BOARD
            </span>
          </div>
          <p className="text-[13px] text-slate-500 mt-1">
            Pusat kontrol strategis lintas divisi untuk pemantauan eksekusi proyek, blocker, dan keputusan Direksi.
          </p>
        </div>

        <Link
          href="/kpi-management/department"
          className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[12px] font-semibold flex items-center gap-2 transition-all cursor-pointer text-decoration-none shadow-2xs"
        >
          <span>Ke KPI Management Suite</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── 2. RICH BIG KPI CARDS WITH PROGRESS LINE BARS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* BIG CARD 1: Status Eksekusi Proyek */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
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

            {/* Progress Line Bar */}
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
            <span>⚡ {summary.atRisk} Risk</span>
            <span>🚨 {summary.offTrack} Off Track</span>
            <span>🕒 {summary.notUpdated} Stale</span>
          </div>
        </div>

        {/* BIG CARD 2: Need Director Decision */}
        <div className={cn(
          "bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden transition-all",
          summary.needDecision > 0 ? "border-purple-300 bg-purple-50/20" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider">Need Decision</span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-purple-950 leading-tight">{summary.needDecision}</h3>
              <span className="text-[12px] font-bold text-purple-700">Menunggu Direksi</span>
            </div>

            {/* Warning Progress Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-purple-700">
                <span>Perlu Keputusan Direktur</span>
                <span>100% Action Required</span>
              </div>
              <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                <div className="bg-purple-600 h-full rounded-full w-full animate-pulse" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-purple-100 text-[11px] font-semibold text-purple-800 truncate">
            📌 Blocker: Supplier MOQ & Power Panel Listrik
          </div>
        </div>

        {/* BIG CARD 3: Proyek Off Track & Critical Risk */}
        <div className={cn(
          "bg-white border rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden",
          summary.offTrack > 0 ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">Critical & Off Track</span>
            <span className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-rose-950 leading-tight">{summary.offTrack + summary.atRisk}</h3>
              <span className="text-[12px] font-bold text-rose-700">Proyek Terkendala</span>
            </div>

            {/* Red Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-700">
                <span>{summary.offTrack} Off Track • {summary.atRisk} At Risk</span>
                <span>Critical</span>
              </div>
              <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${Math.round((summary.offTrack / (summary.totalActive || 1)) * 100)}%` }} className="bg-rose-600 h-full" />
                <div style={{ width: `${Math.round((summary.atRisk / (summary.totalActive || 1)) * 100)}%` }} className="bg-amber-400 h-full" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-rose-100 text-[11px] font-semibold text-rose-800 truncate">
            ⚠️ Terlambat: Webhooks SCM API & Tank 03
          </div>
        </div>

        {/* BIG CARD 4: Target Milestone & Done */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Milestone Achievement</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-slate-900 leading-tight">{summary.completedThisMonth}</h3>
              <span className="text-[12px] font-bold text-emerald-700">Proyek Selesai Bulan Ini</span>
            </div>

            {/* Emerald Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span>Rata-Rata Progress Portfolio</span>
                <span>65.0%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[65%]" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-emerald-700 truncate">
            ✅ Catalog Packaging (75%) • CPKB BPOM (80%)
          </div>
        </div>

      </div>

      {/* ── 3. DIRECTOR ATTENTION TABLE (PERHATIAN DIREKSI) ── */}
      {attentionProjects.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-[14px] font-extrabold text-slate-900 uppercase tracking-wide">
                Need Director Attention (Prioritas Utama Audit)
              </h3>
            </div>
            <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded">
              {attentionProjects.length} Proyek Membutuhkan Respon
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-rose-50/40 border-b border-rose-100 text-[11px] font-bold text-slate-700 uppercase">
                  <th className="py-2.5 px-3">Proyek</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Kendala / Keputusan Yang Diperlukan</th>
                  <th className="py-2.5 px-3">Owner</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3 text-right">Aksi Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100 text-[13px]">
                {attentionProjects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      <Link href={`/project-control/${proj.id}`} className="hover:text-blue-600 transition-colors">
                        {proj.name}
                      </Link>
                      <span className="block text-[11px] font-normal text-slate-500">{proj.department}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <ProjectStatusBadge status={proj.status} />
                    </td>
                    <td className="py-2.5 px-3">
                      {proj.decisionRequired && proj.activeDecision ? (
                        <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-[12px]">
                          <span className="font-bold text-purple-700 block">[KEPUTUSAN DIREKSI] {proj.activeDecision.title}</span>
                          <span className="text-[11px] text-purple-600">{proj.activeDecision.impactIfDelayed}</span>
                        </div>
                      ) : proj.blocker ? (
                        <div className="text-slate-700">
                          <span className="font-semibold text-rose-700 block">[BLOCKER] {proj.blocker.title}</span>
                          <span className="text-[11px] text-slate-500">{proj.blocker.description}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Progress terlambat</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{proj.owner}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[12px]">{proj.deadline}</td>
                    <td className="py-2.5 px-3 text-right">
                      <Link
                        href={`/project-control/${proj.id}`}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer text-decoration-none shadow-2xs"
                      >
                        <span>Audit Detail</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. FILTER BAR & SINGLE PRIMARY CTA ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari proyek, owner, PIC..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="NEED_DECISION">⚠️ Need Decision</option>
            <option value="OFF_TRACK">🚨 Off Track</option>
            <option value="AT_RISK">⚡ At Risk</option>
            <option value="NOT_UPDATED">🕒 Not Updated</option>
            <option value="ON_TRACK">✅ On Track</option>
          </select>

          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Semua Divisi</option>
            <option value="R&D">R&D</option>
            <option value="IT / SYSTEM">IT / SYSTEM</option>
            <option value="CREATIVE">CREATIVE</option>
            <option value="PRODUCTION">PRODUCTION</option>
            <option value="LEGAL / APJ">LEGAL / APJ</option>
          </select>
        </div>

        <button
          onClick={() => alert("Modal Tambah Proyek Baru dapat dikoneksikan ke backend API.")}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Proyek Baru</span>
        </button>
      </div>

      {/* ── 5. MAIN PROJECT PORTFOLIO TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-500" /> Portfolio Proyek Strategis
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Menampilkan {filteredProjects.length} Proyek</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Nama Proyek</th>
                <th className="px-4 py-3">Divisi</th>
                <th className="px-4 py-3">Owner / PIC</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Milestone Aktif</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Keputusan Direksi?</th>
                <th className="px-4 py-3 text-right">Update Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredProjects.map((proj) => (
                <tr key={proj.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <Link href={`/project-control/${proj.id}`} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
                      <span>{proj.name}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-600 transition-opacity" />
                    </Link>
                    <span className="block text-[11px] font-normal text-slate-500 truncate max-w-xs">{proj.objective}</span>
                  </td>

                  <td className="px-4 py-3 font-semibold text-slate-700">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      {proj.department}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900 block">{proj.owner}</span>
                    <span className="text-[11px] text-slate-500">PIC: {proj.pic}</span>
                  </td>

                  <td className="px-4 py-3 w-32">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            proj.progress >= 80 ? "bg-emerald-500" :
                            proj.progress >= 50 ? "bg-blue-500" : "bg-amber-500"
                          )}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-bold font-mono text-slate-800">{proj.progress}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 block text-[12px]">{proj.currentMilestone}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Due: {proj.currentMilestoneDue}</span>
                  </td>

                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={proj.status} />
                  </td>

                  <td className="px-4 py-3">
                    {proj.decisionRequired ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px] border border-purple-200">
                        YA — Open Decision
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Tidak</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right text-[11px] font-mono text-slate-500">
                    {proj.lastUpdate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
