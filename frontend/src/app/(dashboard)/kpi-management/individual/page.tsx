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
  UserCheck
} from "lucide-react";
import { MOCK_INDIVIDUAL_KPIS } from "@/components/kpi-management/mock-data";
import { KPIStatusBadge, KPITrendIndicator, KpiNavTabs } from "@/components/kpi-management/KpiManagementComponents";
import { IndividualKPI } from "@/types/kpi-management";

export default function IndividualKpiPage() {
  const [employees, setEmployees] = useState<IndividualKPI[]>(MOCK_INDIVIDUAL_KPIS);
  const [searchQuery, setSearchQuery] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

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

  // Priority Sort (Off Track -> At Risk -> On Track -> Excellent)
  const filteredEmployees = useMemo(() => {
    return employees.filter(e => {
      const matchSearch = e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.department.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchSeniority = seniorityFilter === "ALL" || e.seniority === seniorityFilter;
      const matchStatus = statusFilter === "ALL" || e.status === statusFilter;

      return matchSearch && matchSeniority && matchStatus;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        OFF_TRACK: 0,
        AT_RISK: 1,
        ON_TRACK: 2,
        EXCELLENT: 3,
      };
      return (priorityOrder[a.status] ?? 99) - (priorityOrder[b.status] ?? 99);
    });
  }, [employees, searchQuery, seniorityFilter, statusFilter]);

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      
      {/* ── 1. HEADER (UN-BOXED POLICY) ── */}
      <div>
        <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
          Individual KPI Management
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Pengukuran kontribusi pencapaian individu berdasarkan tingkat senioritas dan proyek strategis.
        </p>
      </div>

      {/* ── 2. ROUTE TABS ── */}
      <KpiNavTabs />

      {/* ── 3. SENIORITY WEIGHTING RULE BANNER ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <h4 className="text-[12px] font-bold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-600" /> Matriks Distribusi Bobot Senioritas Karyawan
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">Staff / Contributor</span>
            <span className="text-[11px] text-slate-600 block mt-0.5">20% Dept Shared • 70% Role Specific • 10% Project</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">Senior / Coordinator</span>
            <span className="text-[11px] text-slate-600 block mt-0.5">30% Dept Shared • 50% Role Specific • 20% Project</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">Head of Department (HOD)</span>
            <span className="text-[11px] text-slate-600 block mt-0.5">60% Dept Shared • 25% Project • 15% Management</span>
          </div>
        </div>
      </div>

      {/* ── 4. TOP SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Employee KPI</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.avgScore}%</h3>
          <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Rata-rata Karyawan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">On Track Employees</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.onTrack} / {summary.totalEmployees}</h3>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Mencapai Target</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">At Risk Employees</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.atRisk}</h3>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Perlu Pendampingan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Off Track Employees</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.offTrack}</h3>
          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Kritis / Pembinaan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Biggest Improvement</p>
          <h3 className="text-[15px] font-extrabold text-slate-900 mt-1 truncate">{summary.biggestImprovement}</h3>
          <p className="text-[11px] font-medium text-emerald-600 mt-0.5">Kenaikan Tertinggi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Biggest Decline</p>
          <h3 className="text-[15px] font-extrabold text-slate-900 mt-1 truncate">{summary.biggestDecline}</h3>
          <p className="text-[11px] font-medium text-rose-600 mt-0.5">Penurunan Terbesar</p>
        </div>
      </div>

      {/* ── 5. FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
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
      </div>

      {/* ── 6. INDIVIDUAL KPI TABLE ── */}
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

    </div>
  );
}
