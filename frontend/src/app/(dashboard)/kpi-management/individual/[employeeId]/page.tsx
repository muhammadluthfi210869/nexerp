"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Layers, FileText, CheckCircle2, AlertTriangle, ExternalLink, ShieldCheck, FolderOpen } from "lucide-react";
import { MOCK_INDIVIDUAL_KPIS } from "@/components/kpi-management/mock-data";
import { KPIStatusBadge, KPITrendIndicator } from "@/components/kpi-management/KpiManagementComponents";

export default function IndividualKpiDetailPage() {
  const params = useParams();
  const employeeId = params?.employeeId as string;

  const employee = MOCK_INDIVIDUAL_KPIS.find(e => e.id === employeeId) || MOCK_INDIVIDUAL_KPIS[0];

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">
      
      {/* ── BACK LINK & HEADER ── */}
      <div>
        <Link
          href="/kpi-management/individual"
          className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors mb-2 text-decoration-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Overview KPI Karyawan</span>
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] leading-[34px] font-bold text-slate-900 tracking-tight">
                {employee.employeeName}
              </h1>
              <KPIStatusBadge status={employee.status} />
            </div>
            <p className="text-[13px] text-slate-500 mt-1">
              Role: <strong className="text-slate-700">{employee.role}</strong> | Divisi: <strong className="text-slate-700">{employee.department}</strong> | Atasan: <strong className="text-slate-700">{employee.manager}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg border border-slate-200">
              SENIORITAS: {employee.seniority}
            </span>
          </div>
        </div>
      </div>

      {/* ── HEADER SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Final KPI Score</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-0.5 font-mono">{employee.finalKpiScore}%</h3>
          <p className="text-[10px] text-slate-500 font-medium">Target: {employee.targetScore}%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Dept Shared (20%)</p>
          <h3 className="text-[20px] font-black text-slate-800 mt-1 font-mono">{employee.departmentSharedScore}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Kontribusi Divisi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Role Specific (70%)</p>
          <h3 className="text-[20px] font-black text-slate-800 mt-1 font-mono">{employee.roleSpecificScore}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Outcomes Peran</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Project KPI (10%)</p>
          <h3 className="text-[20px] font-black text-slate-800 mt-1 font-mono">{employee.strategicProjectScore}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Proyek Strategis</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Trend vs Bulan Lalu</p>
          <div className="mt-2">
            <KPITrendIndicator trend={employee.trend} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Bukti Audit ERP</p>
          <h3 className="text-[22px] font-black text-blue-600 mt-0.5">{employee.evidenceCount || 0}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Operational Records</p>
        </div>
      </div>

      {/* ── INDIVIDUAL KPI BREAKDOWN TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" /> Rincian Komponen KPI Role ({employee.kpiItems.length} Indicator)
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Formula: Capped Max 120%</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <th className="px-4 py-3">Nama KPI & Definisi</th>
                <th className="px-4 py-3 text-center">Bobot (%)</th>
                <th className="px-4 py-3 text-center">Target</th>
                <th className="px-4 py-3 text-center">Aktual</th>
                <th className="px-4 py-3 text-center">Achievement</th>
                <th className="px-4 py-3 text-center">Capped (Max 120%)</th>
                <th className="px-4 py-3 text-center">Skor Terbobot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sumber Data ERP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[13px]">
              {employee.kpiItems.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <span className="font-bold text-slate-900 block">{kpi.name}</span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{kpi.definition}</span>
                  </td>

                  <td className="px-4 py-3 text-center font-bold font-mono text-slate-800">{kpi.weight}%</td>

                  <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                    {kpi.target} {kpi.unit}
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                    {kpi.actual} {kpi.unit}
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-800">
                    {kpi.achievement.toFixed(1)}%
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-extrabold text-blue-700 bg-blue-50/40">
                    {kpi.cappedContribution.toFixed(1)}%
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-black text-slate-900 text-[14px]">
                    {kpi.weightedScore.toFixed(1)}
                  </td>

                  <td className="px-4 py-3">
                    <KPIStatusBadge status={kpi.status} />
                  </td>

                  <td className="px-4 py-3 text-[12px] font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{kpi.dataSource}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SUPPORTING OPERATIONAL EVIDENCE DRILL-DOWN ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 mb-3">
          <FolderOpen className="w-4 h-4 text-slate-500" /> Bukti Audit Operasional ERP (Supporting Evidence)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">Purchase Orders Disetujui (Bulan Ini)</span>
            <p className="text-[11px] text-slate-600 mt-0.5">14 PO Terbit (13 Tepat Waktu &lt;24 Jam, 1 Overdue)</p>
            <span className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer block mt-1">
              Audit Data PO di Modul SCM &rarr;
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block">Proyek Strategis Terhubung</span>
            <p className="text-[11px] text-slate-600 mt-0.5">ERP PO & SCM Integration (Milestone 2 In Progress)</p>
            <Link href="/project-control/proj-2" className="text-[11px] text-blue-600 font-semibold hover:underline block mt-1">
              Audit Proyek di Project Control Hub &rarr;
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
