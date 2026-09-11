"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowUpRight,
  TrendingUp,
  Award,
  Filter,
  UserCheck,
  Building2,
  FolderOpen,
  LayoutGrid,
  List
} from "lucide-react";
import { MOCK_INDIVIDUAL_KPIS } from "@/components/kpi-management/mock-data";
import { KPIStatusBadge, KPITrendIndicator, KpiNavTabs } from "@/components/kpi-management/KpiManagementComponents";
import { type IndividualKPI } from "@/types/kpi-management";
import { cn } from "@/lib/utils";

export default function IndividualKpiPage() {
  const [employees, setEmployees] = useState<IndividualKPI[]>(MOCK_INDIVIDUAL_KPIS);
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [seniorityFilter, setSeniorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"CARDS" | "TABLE">("CARDS");

  // Summary Metrics
  const summary = useMemo(() => {
    const totalScore = employees.reduce((acc, e) => acc + e.finalKpiScore, 0);
    const avgScore = Math.round((totalScore / (employees.length || 1)) * 10) / 10;
    const onTrack = employees.filter(e => e.status === "EXCELLENT" || e.status === "ON_TRACK").length;
    const atRisk = employees.filter(e => e.status === "AT_RISK").length;
    const offTrack = employees.filter(e => e.status === "OFF_TRACK").length;

    return {
      avgScore,
      onTrack,
      totalEmployees: employees.length,
      atRisk,
      offTrack,
      biggestImprovement: "Siti Aminah (+4.0 pts)",
      biggestDecline: "Niko Pratama (-2.0 pts)"
    };
  }, [employees]);

  // Priority Sort (Off Track -> At Risk -> On Track -> Excellent) with Dept & Seniority Filter
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchDept = deptFilter === "ALL" || e.department.toUpperCase().includes(deptFilter.toUpperCase());
      const matchSeniority = seniorityFilter === "ALL" || e.seniority === seniorityFilter;
      const matchStatus = statusFilter === "ALL" || e.status === statusFilter;

      return matchSearch && matchDept && matchSeniority && matchStatus;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        OFF_TRACK: 0,
        AT_RISK: 1,
        ON_TRACK: 2,
        EXCELLENT: 3,
      };
      return (priorityOrder[a.status] ?? 99) - (priorityOrder[b.status] ?? 99);
    });
  }, [employees, searchQuery, deptFilter, seniorityFilter, statusFilter]);

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      
      {/* ── 1. HEADER (UN-BOXED POLICY) ── */}
      <div>
        <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
          Individual KPI Management
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Pengukuran kontribusi pencapaian individu berdasarkan divisi, tingkat senioritas, dan proyek strategis.
        </p>
      </div>

      {/* ── 2. ROUTE TABS ── */}
      <KpiNavTabs />

      {/* ── 3. RICH BIG KPI CARDS WITH PROGRESS LINE BARS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* BIG CARD 1: Rata-Rata Performa Karyawan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Avg Individual KPI Score</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-slate-900 leading-tight">{summary.avgScore}%</h3>
              <span className="text-[12px] font-bold text-blue-600">Target 90.0%</span>
            </div>

            {/* Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-600">On Track: {summary.onTrack}/{summary.totalEmployees} Karyawan</span>
                <span className="text-slate-700">{Math.round((summary.onTrack / summary.totalEmployees) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${Math.round((summary.onTrack / summary.totalEmployees) * 100)}%` }} className="bg-emerald-500 h-full rounded-full transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>📈 Naik: {summary.biggestImprovement}</span>
            <span>📉 Turun: {summary.biggestDecline}</span>
          </div>
        </div>

        {/* BIG CARD 2: Evaluasi & Perlu Pembinaan */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">Perlu Pendampingan Karyawan</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-slate-900 leading-tight">{summary.atRisk + summary.offTrack}</h3>
              <span className="text-[12px] font-bold text-amber-700">Karyawan Di Bawah Target</span>
            </div>

            {/* Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
                <span>Rincian Status Kritis</span>
                <span>{summary.atRisk} At Risk • {summary.offTrack} Off Track</span>
              </div>
              <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${Math.round((summary.atRisk / summary.totalEmployees) * 100)}%` }} className="bg-amber-400 h-full" />
                <div style={{ width: `${Math.round((summary.offTrack / summary.totalEmployees) * 100)}%` }} className="bg-rose-500 h-full" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-100 text-[11px] font-semibold text-amber-900 truncate">
            ⚠️ Rekomendasi: Evaluasi lead time & pendampingan teknis role
          </div>
        </div>

        {/* BIG CARD 3: Matriks Bobot Senioritas */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Distribusi Bobot Senioritas</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between font-semibold p-1.5 bg-slate-50 rounded-lg">
              <span className="text-slate-900">Staff / Operational</span>
              <span className="text-blue-700 font-bold font-mono">70% Role Outcome</span>
            </div>
            <div className="flex items-center justify-between font-semibold p-1.5 bg-slate-50 rounded-lg">
              <span className="text-slate-900">Senior Coordinator</span>
              <span className="text-blue-700 font-bold font-mono">50% Role • 20% Project</span>
            </div>
            <div className="flex items-center justify-between font-semibold p-1.5 bg-slate-50 rounded-lg">
              <span className="text-slate-900">Head of Dept (HOD)</span>
              <span className="text-blue-700 font-bold font-mono">60% Dept Shared</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 truncate">
            💡 Pembobotan disesuaikan dengan tanggung jawab manajerial
          </div>
        </div>

      </div>

      {/* ── 4. FILTER BAR LENGKAP (INCLUDES FILTER PER DIVISI) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari karyawan, role, divisi..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* FILTER PER DIVISI (EXPLICIT USER REQUEST) */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600 hidden sm:block" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 border border-blue-200 bg-blue-50/50 rounded-lg text-[13px] font-bold text-blue-900 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">🏢 Semua Divisi</option>
              <option value="PURCHASING">SCM & Purchasing</option>
              <option value="RESEARCH">Research & Development (R&D)</option>
              <option value="PRODUCTION">Production</option>
              <option value="SALES">Sales & Business Development</option>
              <option value="QUALITY">Quality Control (QC/QA)</option>
              <option value="FINANCE">Finance & Accounting</option>
              <option value="LEGAL">Legal & Regulatory (APJ)</option>
              <option value="HR">HR & General Affair</option>
            </select>
          </div>

          {/* Seniority Filter */}
          <select
            value={seniorityFilter}
            onChange={(e) => setSeniorityFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Semua Senioritas</option>
            <option value="STAFF">Staff / Contributor</option>
            <option value="SENIOR">Senior / Coordinator</option>
            <option value="HEAD_OF_DEPARTMENT">Head of Dept (HOD)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 bg-white cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="EXCELLENT">🌟 Excellent (&ge;100%)</option>
            <option value="ON_TRACK">✅ On Track (90–99%)</option>
            <option value="AT_RISK">⚡ At Risk (80–89%)</option>
            <option value="OFF_TRACK">🚨 Off Track (&lt;80%)</option>
          </select>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("CARDS")}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer",
              viewMode === "CARDS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Kartu KPI</span>
          </button>
          <button
            onClick={() => setViewMode("TABLE")}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer",
              viewMode === "TABLE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
            )}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabel Matrix</span>
          </button>
        </div>
      </div>

      {/* ── 5. VIEW MODE: INDIVIDUAL KPI CARDS GRID (KARTU PER ORANG) ── */}
      {viewMode === "CARDS" ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" /> Kartu KPI Individu Karyawan
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Menampilkan {filteredEmployees.length} Karyawan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEmployees.map((emp) => {
              const isOnTrack = emp.finalKpiScore >= 90;
              const isUnder = emp.finalKpiScore < 80;

              return (
                <div
                  key={emp.id}
                  className={cn(
                    "bg-white border rounded-2xl p-5 shadow-2xs transition-all flex flex-col justify-between space-y-4 hover:shadow-md",
                    isUnder ? "border-rose-300" : isOnTrack ? "border-emerald-300" : "border-amber-300"
                  )}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-extrabold uppercase">
                          {emp.seniority}
                        </span>
                        <h4 className="text-[18px] font-black text-slate-900 mt-1 leading-tight">{emp.employeeName}</h4>
                        <p className="text-[12px] font-semibold text-slate-600">{emp.role}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{emp.department}</p>
                      </div>

                      <KPIStatusBadge status={emp.status} />
                    </div>
                  </div>

                  {/* Big Final Score & Line Bar */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">Final Skor KPI</span>
                      <span className="text-[11px] font-bold text-slate-500 font-mono">Target: {emp.targetScore}%</span>
                    </div>

                    <div className="flex items-baseline gap-2 mt-0.5">
                      <h3 className="text-[30px] font-black text-slate-900 font-mono leading-none">{emp.finalKpiScore}%</h3>
                      <KPITrendIndicator trend={emp.trend} />
                    </div>

                    {/* Progress Line Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isUnder ? "bg-rose-500" : isOnTrack ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${Math.min(emp.finalKpiScore, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* 3 Sub-Metric Score Breakdown Pills */}
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100">
                      <span className="text-slate-500 block font-semibold">Dept Shared</span>
                      <span className="font-mono font-bold text-blue-900 text-[12px]">{emp.departmentSharedScore}</span>
                    </div>
                    <div className="p-2 bg-emerald-50/60 rounded-lg border border-emerald-100">
                      <span className="text-slate-500 block font-semibold">Role Outcome</span>
                      <span className="font-mono font-bold text-emerald-900 text-[12px]">{emp.roleSpecificScore}</span>
                    </div>
                    <div className="p-2 bg-purple-50/60 rounded-lg border border-purple-100">
                      <span className="text-slate-500 block font-semibold">Strategic Proj</span>
                      <span className="font-mono font-bold text-purple-900 text-[12px]">{emp.strategicProjectScore}</span>
                    </div>
                  </div>

                  {/* Card Footer Action */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-rose-600 font-bold truncate max-w-[170px]">📌 {emp.lowestKpiName}</span>

                    <Link
                      href={`/kpi-management/individual/${emp.id}`}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer text-decoration-none shadow-2xs"
                    >
                      <span>Audit Bukti</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── 6. VIEW MODE: INDIVIDUAL KPI TABLE ── */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" /> Matrix Performa KPI Individu Karyawan
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Menampilkan {filteredEmployees.length} Karyawan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3">Nama Karyawan</th>
                  <th className="px-4 py-3">Divisi & Role</th>
                  <th className="px-4 py-3">Senioritas</th>
                  <th className="px-4 py-3">Manager / Atasan</th>
                  <th className="px-4 py-3">Final Skor KPI</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Status KPI</th>
                  <th className="px-4 py-3">Trend</th>
                  <th className="px-4 py-3">Lowest KPI</th>
                  <th className="px-4 py-3 text-right">Audit Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      <Link href={`/kpi-management/individual/${emp.id}`} className="hover:text-blue-600 transition-colors">
                        {emp.employeeName}
                      </Link>
                      <span className="block text-[10px] text-slate-400 font-mono">{emp.employeeId}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 block">{emp.role}</span>
                      <span className="text-[11px] text-slate-500">{emp.department}</span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-bold">
                        {emp.seniority}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-700">{emp.manager}</td>

                    <td className="px-4 py-3">
                      <span className="text-[16px] font-black text-slate-900 font-mono">
                        {emp.finalKpiScore}%
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-500 text-[12px]">{emp.targetScore}%</td>

                    <td className="px-4 py-3">
                      <KPIStatusBadge status={emp.status} />
                    </td>

                    <td className="px-4 py-3">
                      <KPITrendIndicator trend={emp.trend} />
                    </td>

                    <td className="px-4 py-3 text-[12px] font-medium text-rose-700">
                      {emp.lowestKpiName}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/kpi-management/individual/${emp.id}`}
                        className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer text-decoration-none shadow-2xs"
                      >
                        <span>Bukti Audit</span>
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

    </div>
  );
}
