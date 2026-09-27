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
import { ArrowLeft, Layers, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { KPIStatusBadge, KPITrendIndicator } from "@/components/kpi-management/KpiManagementComponents";
import { type DepartmentKPI } from "@/types/kpi-management";

export default function DepartmentKpiDetailPage() {
  const params = useParams();
  const departmentId = (params?.departmentId as string) || "";

  const { data: department, isLoading } = useQuery<DepartmentKPI>({
    queryKey: ["department-kpi", departmentId],
    queryFn: async () => {
      const res = await api.get(`/hr/kpi/departments/${departmentId}`);
      return res.data;
    },
    enabled: !!departmentId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-24 bg-[#F8FAFC] min-h-screen text-slate-900 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-600">Sinkronisasi KPI Departemen...</p>
      </div>
    );
  }

  if (!department) {
    return (
      <div className="space-y-6 px-6 py-12 bg-[#F8FAFC] min-h-screen text-slate-900 flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mb-2" />
        <h2 className="text-xl font-bold">Departemen Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500 max-w-md mt-1">
          Tidak ditemukan data KPI untuk ID departemen: <code className="text-rose-600 font-mono">{departmentId}</code>
        </p>
        <Link
          href="/master/kpi-department"
          className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar KPI Departemen</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6 bg-[#F8FAFC] min-h-screen text-slate-900">

      {/* ── BACK LINK & HEADER ── */}
      <div>
        <Link
          href="/master/kpi-department"
          className="text-[12px] font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 transition-colors mb-2 text-decoration-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Overview KPI Departemen</span>
        </Link>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[26px] leading-[34px] font-bold text-slate-900 tracking-tight">
                {department.departmentName}
              </h1>
              <KPIStatusBadge status={department.status} />
            </div>
            <p className="text-[13px] text-slate-500 mt-1">
              Head of Department: <strong className="text-slate-700">{department.headOfDepartment}</strong> | Terakhir Dihitung: <strong className="text-slate-700">{department.lastCalculated}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ── HEADER SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Skor KPI Terbobot</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-0.5 tabular-nums">{department.finalWeightedScore}%</h3>
          <p className="text-[10px] text-slate-500 font-medium">Σ (Achievement × Weight)</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Target Standar</p>
          <h3 className="text-[26px] font-black text-slate-900 mt-0.5 tabular-nums">{department.targetScore}%</h3>
          <p className="text-[10px] text-slate-500 font-medium">Batas Lulus Departemen</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Status Performa</p>
          <div className="mt-1">
            <KPIStatusBadge status={department.status} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Perubahan vs Bulan Lalu</p>
          <div className="mt-2">
            <KPITrendIndicator trend={department.trend} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Best KPI Component</p>
          <p className="text-[12px] font-bold text-emerald-700 mt-1 truncate">First Sample Approval</p>
          <p className="text-[10px] text-emerald-600 tabular-nums font-bold">106.2%</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Worst KPI Component</p>
          <p className="text-[12px] font-bold text-rose-700 mt-1 truncate">{department.lowestKpiName}</p>
          <p className="text-[10px] text-rose-600 tabular-nums font-bold">{department.lowestKpiScore}%</p>
        </div>
      </div>

      {/* ── KPI BREAKDOWN TABLE ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-500" /> Matriks Komponen KPI Departemen ({department.kpis.length} Indicator)
          </h3>
          <span className="text-[11px] text-slate-400 tabular-nums">Capped Max Contribution: 120%</span>
        </div>

        <div className="overflow-x-auto">
          <DnaTable>
            <DnaTableHead>
              <DnaTableRow className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <DnaTh className="px-4 py-3">Nama KPI & Definisi</DnaTh>
                <DnaTh className="px-4 py-3">Tipe</DnaTh>
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
              {department.kpis.map((kpi) => (
                <DnaTableRow key={kpi.id} className="hover:bg-slate-50/60 transition-colors">
                  <DnaTd className="px-4 py-3 max-w-xs">
                    <span className="font-bold text-slate-900 block">{kpi.name}</span>
                    <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">{kpi.definition}</span>
                  </DnaTd>

                  <DnaTd className="px-4 py-3 tabular-nums text-[11px]">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                      {kpi.calcType === "HIGHER_IS_BETTER" ? "↑ Higher" : "↓ Lower"}
                    </span>
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
    </div>
  );
}
