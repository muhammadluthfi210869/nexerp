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
  Filter,
  BarChart3,
  Target
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

      {/* ── 3. RICH BIG KPI CARDS WITH PROGRESS LINE BARS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* BIG CARD 1: Rata-Rata Performa Departemen */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Rata-Rata Performa Perusahaan</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="w-4 h-4" />
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
                <span className="text-slate-600">Skor Terbobot Saat Ini</span>
                <span className="text-blue-600">{summary.avgScore}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div style={{ width: `${Math.min(summary.avgScore, 100)}%` }} className="bg-blue-600 h-full rounded-full transition-all" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
            <span>✅ {summary.excellentOrOnTrack} On Track</span>
            <span>⚡ {summary.atRisk} Risk</span>
            <span>🚨 {summary.offTrack} Off Track</span>
          </div>
        </div>

        {/* BIG CARD 2: Departemen Kritis & Risk */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">Departemen Perlu Perhatian</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-slate-900 leading-tight">{summary.atRisk + summary.offTrack}</h3>
              <span className="text-[12px] font-bold text-amber-700">Divisi Belum Target</span>
            </div>

            {/* Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
                <span>Pass Rate Divisi ({summary.excellentOrOnTrack}/{summary.totalDepts})</span>
                <span>{Math.round((summary.excellentOrOnTrack / summary.totalDepts) * 100)}%</span>
              </div>
              <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${Math.round((summary.excellentOrOnTrack / summary.totalDepts) * 100)}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${Math.round(((summary.atRisk + summary.offTrack) / summary.totalDepts) * 100)}%` }} className="bg-amber-500 h-full" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-amber-100 text-[11px] font-semibold text-amber-900 truncate">
            ⚠️ Terendah: R&D (78.5%) • BusDev (88.0%)
          </div>
        </div>

        {/* BIG CARD 3: Kesehatan Komponen KPI */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Komponen KPI Merah</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-rose-600 leading-tight">{summary.belowTargetCount}</h3>
              <span className="text-[12px] font-bold text-slate-500">Indikator Di Bawah Target</span>
            </div>

            {/* Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-600">
                <span>Lowest Drag: R&D Revision Rate</span>
                <span>56.0%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[56%]" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 truncate">
            📌 Perlu evaluasi proses teknis lab & supplier lead time
          </div>
        </div>

        {/* BIG CARD 4: Tren Pergerakan Bulanan */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">Tren Performa Bulanan</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-[32px] font-black text-emerald-600 leading-tight">+2.4 pts</h3>
              <span className="text-[12px] font-bold text-slate-500">Rata-Rata Pergerakan</span>
            </div>

            {/* Line Bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span>Peningkatan Kualitas Departemen</span>
                <span>Positive Trend</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full w-[80%]" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-600 truncate">
            📈 Kenaikan: R&D (+4.0) • Penurunan: SCM (-2.0)
          </div>
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
