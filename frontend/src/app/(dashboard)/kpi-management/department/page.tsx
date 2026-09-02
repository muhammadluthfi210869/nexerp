"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Building2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  ArrowUpRight,
  TrendingUp,
  Award,
  Filter
} from "lucide-react";
import { MOCK_DEPARTMENT_KPIS } from "@/components/kpi-management/mock-data";
import { KPIStatusBadge, KPITrendIndicator, KpiNavTabs } from "@/components/kpi-management/KpiManagementComponents";
import { DepartmentKPI } from "@/types/kpi-management";

export default function DepartmentKpiPage() {
  const [departments, setDepartments] = useState<DepartmentKPI[]>(MOCK_DEPARTMENT_KPIS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Summary Metrics
  const summary = useMemo(() => {
    const totalScore = departments.reduce((acc, d) => acc + d.finalWeightedScore, 0);
    const avgScore = Math.round((totalScore / (departments.length || 1)) * 10) / 10;
    const excellentOrOnTrack = departments.filter(d => d.status === "EXCELLENT" || d.status === "ON_TRACK").length;
    const atRisk = departments.filter(d => d.status === "AT_RISK").length;
    const offTrack = departments.filter(d => d.status === "OFF_TRACK").length;
    
    return {
      avgScore,
      excellentOrOnTrack,
      totalDepts: departments.length,
      atRisk,
      offTrack,
      belowTargetCount: 11,
      biggestDecline: "R&D (-6.0 pts)"
    };
  }, [departments]);

  // Priority Filter & Sort (Off Track -> At Risk -> On Track -> Excellent)
  const filteredDepartments = useMemo(() => {
    return departments.filter(d => {
      const matchSearch = d.departmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.headOfDepartment.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchSearch && matchStatus;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = {
        OFF_TRACK: 0,
        AT_RISK: 1,
        ON_TRACK: 2,
        EXCELLENT: 3,
      };
      return (priorityOrder[a.status] ?? 99) - (priorityOrder[b.status] ?? 99);
    });
  }, [departments, searchQuery, statusFilter]);

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      
      {/* ── 1. HEADER (UN-BOXED POLICY) ── */}
      <div>
        <h1 className="text-[28px] leading-[36px] font-bold text-slate-900 tracking-tight">
          Department KPI Management
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Pengukuran outcome performa departemen terbobot untuk evaluasi pencapaian Direksi.
        </p>
      </div>

      {/* ── 2. ROUTE TABS ── */}
      <KpiNavTabs />

      {/* ── 3. TOP SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Avg Department KPI</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.avgScore}%</h3>
          <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Rata-rata Perusahaan</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">On Track Depts</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.excellentOrOnTrack} / {summary.totalDepts}</h3>
          <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Mencapai Target</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">At Risk Depts</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.atRisk}</h3>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Mendekati Batas Bawah</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Off Track Depts</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.offTrack}</h3>
          <p className="text-[11px] font-semibold text-rose-600 mt-0.5">Di Bawah Threshold</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">KPI Below Target</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-1">{summary.belowTargetCount}</h3>
          <p className="text-[11px] font-medium text-slate-500 mt-0.5">Komponen Merah</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Biggest Decline</p>
          <h3 className="text-[16px] font-extrabold text-slate-900 mt-1 truncate">{summary.biggestDecline}</h3>
          <p className="text-[11px] font-medium text-rose-600 mt-0.5">Penurunan Terbesar</p>
        </div>
      </div>

      {/* ── 4. FILTER BAR ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari departemen / Head of Department..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

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

      {/* ── 5. DEPARTMENT KPI OVERVIEW TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" /> Department KPI Matrix
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">Menampilkan {filteredDepartments.length} Departemen</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Nama Departemen</th>
                <th className="px-4 py-3">Department Head</th>
                <th className="px-4 py-3">Skor Terbobot</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status KPI</th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3">Komponen Terendah (Drag)</th>
                <th className="px-4 py-3 text-right">Audit Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="hover:bg-slate-50/60 transition-colors group">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <Link href={`/kpi-management/department/${dept.id}`} className="hover:text-blue-600 transition-colors">
                      {dept.departmentName}
                    </Link>
                  </td>

                  <td className="px-4 py-3 font-medium text-slate-700">{dept.headOfDepartment}</td>

                  <td className="px-4 py-3">
                    <span className="text-[16px] font-black text-slate-900 font-mono">
                      {dept.finalWeightedScore}%
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono text-slate-500 text-[12px]">{dept.targetScore}%</td>

                  <td className="px-4 py-3">
                    <KPIStatusBadge status={dept.status} />
                  </td>

                  <td className="px-4 py-3">
                    <KPITrendIndicator trend={dept.trend} />
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-[12px]">
                      <span className="font-bold text-rose-700 block">{dept.lowestKpiName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Skor: {dept.lowestKpiScore}%</span>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/kpi-management/department/${dept.id}`}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer text-decoration-none shadow-2xs"
                    >
                      <span>Rincian KPI</span>
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
