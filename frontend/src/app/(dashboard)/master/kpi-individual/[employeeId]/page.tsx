"use client";

import {
  DnaTable,
  DnaTableHead,
  DnaTableBody,
  DnaTableRow,
  DnaTh,
  DnaTd,
} from "@/components/dna";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Layers, FileText, AlertTriangle, FolderOpen, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KPIStatusBadge, KPITrendIndicator } from "@/components/kpi-management/KpiManagementComponents";
import { type IndividualKPI } from "@/types/kpi-management";

export default function IndividualKpiDetailPage() {
  const params = useParams();
  const employeeId = (params?.employeeId as string) || "";

  const { data: employee, isLoading } = useQuery<IndividualKPI>({
    queryKey: ["individual-kpi", employeeId],
    queryFn: async () => {
      const res = await api.get(`/hr/kpi/individual/${employeeId}`);
      return res.data;
    },
    enabled: !!employeeId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-24 bg-[#F8FAFC] min-h-screen text-slate-900 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Sinkronisasi KPI Karyawan...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="space-y-6 px-6 py-12 bg-[#F8FAFC] min-h-screen text-slate-900 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
        <h2 className="text-xl font-bold">Karyawan Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Tidak ditemukan data KPI untuk ID karyawan: <code className="text-rose-600 font-mono">{employeeId}</code>
        </p>
        <Link
          href="/master/kpi-individual"
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar KPI Karyawan</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">

      {/* ── BACK LINK & HEADER ── */}
      <div>
        <Link
          href="/master/kpi-individual"
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
          <h3 className="text-[26px] font-black text-slate-900 mt-0.5 tabular-nums">{employee.finalKpiScore}%</h3>
          <p className="text-[10px] text-slate-500 font-medium">Target: {employee.targetScore}%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Dept Shared (20%)</p>
          <h3 className="text-[20px] font-black text-slate-800 mt-1 tabular-nums">{employee.departmentSharedScore}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Kontribusi Divisi</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Role Specific (70%)</p>
          <h3 className="text-[20px] font-black text-slate-800 mt-1 tabular-nums">{employee.roleSpecificScore}</h3>
          <p className="text-[10px] text-slate-500 font-medium">Outcomes Peran</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Project KPI (10%)</p>
          <h3 className="text-[20px] font-black text-slate-800 mt-1 tabular-nums">{employee.strategicProjectScore}</h3>
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
          <span className="text-[11px] text-slate-400 tabular-nums">Formula: Capped Max 120%</span>
        </div>

        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <DnaTh className="px-4 py-3">Nama KPI & Definisi</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Bobot (%)</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Target</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Aktual</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Achievement</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Capped (Max 120%)</DnaTh>
                <DnaTh className="px-4 py-3 text-center">Skor Terbobot</DnaTh>
                <DnaTh className="px-4 py-3">Status</DnaTh>
                <DnaTh className="px-4 py-3">Sumber Data ERP</DnaTh>
              </DnaTableRow>
            </DnaTableHead>
            <DnaTableBody>
              {employee.kpiItems.map((kpi) => (
                <DnaTableRow key={kpi.id} className="hover:bg-slate-50/60 transition-colors">
                  <DnaTd className="px-4 py-3 max-w-xs">
                    <span className="font-bold text-slate-900 block">{kpi.name}</span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{kpi.definition}</span>
                  </DnaTd>

                  <DnaTd className="px-4 py-3 text-center font-bold tabular-nums text-slate-800">{kpi.weight}%</DnaTd>

                  <DnaTd className="px-4 py-3 text-center tabular-nums font-semibold text-slate-700">
                    {kpi.target} {kpi.unit}
                  </DnaTd>

                  <DnaTd className="px-4 py-3 text-center tabular-nums font-bold text-slate-900">
                    {kpi.actual} {kpi.unit}
                  </DnaTd>

                  <DnaTd className="px-4 py-3 text-center tabular-nums font-bold text-slate-800">
                    {kpi.achievement.toFixed(1)}%
                  </DnaTd>

                  <DnaTd className="px-4 py-3 text-center tabular-nums font-extrabold text-blue-700 bg-blue-50/40">
                    {kpi.cappedContribution.toFixed(1)}%
                  </DnaTd>

                  <DnaTd className="px-4 py-3 text-center tabular-nums font-black text-slate-900 text-[14px]">
                    {kpi.weightedScore.toFixed(1)}
                  </DnaTd>

                  <DnaTd className="px-4 py-3">
                    <KPIStatusBadge status={kpi.status} />
                  </DnaTd>

                  <DnaTd className="px-4 py-3 text-[12px] font-medium text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{kpi.dataSource}</span>
                    </div>
                  </DnaTd>
                </DnaTableRow>
              ))}
            </DnaTableBody>
          </DnaTable>
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
            <Link href="/samples/project-control/proj-2" className="text-[11px] text-blue-600 font-semibold hover:underline block mt-1">
              Audit Proyek di Project Control Hub &rarr;
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
