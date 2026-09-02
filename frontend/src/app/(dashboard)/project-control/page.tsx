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
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MOCK_PROJECTS, MOCK_PROJECT_HEALTH } from "@/components/project-control/mock-data";
import { ProjectStatusBadge, ProjectHealthMeter } from "@/components/project-control/ProjectControlComponents";
import { Project, ProjectStatus } from "@/types/project-control";

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
      // Default Sort Order: Need Decision -> Off Track -> At Risk -> Not Updated -> On Track
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

      {/* ── 2. TOP SUMMARY CARDS (3-LAYER COMPACT STRUCTURE) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1 — Need Decision (HIGH PRIORITY) */}
        <div className={cn(
          "bg-white border rounded-xl p-4 shadow-2xs transition-all relative overflow-hidden",
          summary.needDecision > 0 ? "border-purple-300 bg-purple-50/20" : "border-slate-200"
        )}>
          <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Need Decision</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.needDecision}</h3>
          <p className="text-[11px] font-semibold text-purple-600 mt-0.5">Membutuhkan Direksi</p>
        </div>

        {/* Card 2 — Off Track */}
        <div className={cn(
          "bg-white border rounded-xl p-4 shadow-2xs transition-all",
          summary.offTrack > 0 ? "border-rose-300 bg-rose-50/20" : "border-slate-200"
        )}>
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Off Track</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.offTrack}</h3>
          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Kritis / Keterlambatan</p>
        </div>

        {/* Card 3 — At Risk */}
        <div className={cn(
          "bg-white border rounded-xl p-4 shadow-2xs transition-all",
          summary.atRisk > 0 ? "border-amber-300 bg-amber-50/20" : "border-slate-200"
        )}>
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">At Risk</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.atRisk}</h3>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Potensi Kendala</p>
        </div>

        {/* Card 4 — Not Updated */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Not Updated</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.notUpdated}</h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">&gt; 2 Hari Stale</p>
        </div>

        {/* Card 5 — On Track */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">On Track</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.onTrack}</h3>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">
            {Math.round((summary.onTrack / (summary.totalActive || 1)) * 100)}% dari aktif
          </p>
        </div>

        {/* Card 6 — Active Projects */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Active</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.totalActive}</h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Proyek Berjalan</p>
        </div>
      </div>

      {/* ── 3. HEALTH DISTRIBUTION BAR ── */}
      <ProjectHealthMeter summary={summary} />

      {/* ── 4. DIRECTOR ATTENTION TABLE (PERHATIAN DIREKSI) ── */}
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

      {/* ── 5. FILTER BAR & SINGLE PRIMARY CTA ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
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

          {/* Status Filter */}
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

          {/* Department Filter */}
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

        {/* Single Primary Action Button */}
        <button
          onClick={() => alert("Modal Tambah Proyek Baru dapat dikoneksikan ke backend API.")}
          className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Proyek Baru</span>
        </button>
      </div>

      {/* ── 6. MAIN PROJECT PORTFOLIO TABLE ── */}
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
