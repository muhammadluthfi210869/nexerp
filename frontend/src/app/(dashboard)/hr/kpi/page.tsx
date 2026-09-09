"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { unwrapResponse } from "@/lib/unwrap-response";
import {
  Award,
  TrendingUp,
  Target,
  Search,
  Filter,
  Eye,
  Star,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface KpiScorecard {
  id: string;
  empName: string;
  empRole: string;
  department: string;
  targetKpi: string;
  achievement: number; // percentage
  grade: "A" | "B+" | "B" | "C";
  bonusEligible: boolean;
}

const FALLBACK_KPIS: KpiScorecard[] = [
  { id: "1", empName: "Budi Santoso", empRole: "Supervisor Mixing", department: "Produksi", targetKpi: "Zero Batch Scrap & OEE > 85%", achievement: 94.5, grade: "A", bonusEligible: true },
  { id: "2", empName: "Rian Saputra", empRole: "R&D Formulator", department: "R&D", targetKpi: "Lead Time Sample < 5 Hari", achievement: 91.0, grade: "A", bonusEligible: true },
  { id: "3", empName: "Siti Rahmawati", empRole: "QC Inspector", department: "QC", targetKpi: "COA Release SLA < 24 Jam", achievement: 88.0, grade: "B+", bonusEligible: true },
  { id: "4", empName: "Dewi Lestari", empRole: "BusDev Maklon", department: "BusDev", targetKpi: "Monthly Deals > Rp 800 Juta", achievement: 102.5, grade: "A", bonusEligible: true },
];

export default function HrKpiPage() {
  const toast = useDnaToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState("Q3-2026");

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Evaluasi Kinerja & KPI Karyawan (Performance Scorecard)"
        description="Sistem penilaian KPI 360 derajat, pencapaian target SLA operasional, kalkulasi bonus kinerja, dan grading."
        badge={
          <div className="flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>Periode Review: {period}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-semibold"
            >
              <option value="Q3-2026">Kuartal 3 (Q3 2026)</option>
              <option value="Q2-2026">Kuartal 2 (Q2 2026)</option>
              <option value="Q1-2026">Kuartal 1 (Q1 2026)</option>
            </select>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Kalkulasi Rekap Bonus Kinerja Q3 Selesai")}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Proses Grading & Bonus
            </DnaButton>
          </div>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Rata-rata Skor KPI Pabrik"
          value="92.4%"
          icon={<Target className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+3.2% vs Q2", isPositive: true }}
          subtext="Target Perusahaan Tercapai"
          variant="success"
        />
        <DnaStatCard
          label="Karyawan Grade A (Top)"
          value="38 Orang"
          icon={<Award className="w-5 h-5 text-purple-600" />}
          subtext="Skor Pencapaian > 90%"
          variant="purple"
        />
        <DnaStatCard
          label="Karyawan Eligible Bonus"
          value="112 Orang"
          icon={<Star className="w-5 h-5 text-blue-600" />}
          delta={{ value: "90.3% Headcount", isPositive: true }}
          subtext="Memenuhi Syarat Insentif"
          variant="info"
        />
        <DnaStatCard
          label="Perlu Pembinaan (Grade C)"
          value="2 Orang"
          icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
          delta={{ value: "PIP Program", isPositive: false }}
          subtext="Coaching & Mentoring Khusus"
          variant="warning"
        />
      </DnaKpiGrid>

      <DnaDataTableCard
        title="Scorecard Pencapaian KPI Karyawan"
        badge={<DnaBadge variant="default">{FALLBACK_KPIS.length} Dinilai</DnaBadge>}
        customToolbar={
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari karyawan / departemen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-3.5 py-3">Nama Pegawai</th>
                <th className="px-3.5 py-3">Jabatan & Departemen</th>
                <th className="px-3.5 py-3">Indikator Kunci (Key KPI)</th>
                <th className="px-3.5 py-3 text-right">Pencapaian (%)</th>
                <th className="px-3.5 py-3 text-center">Grade</th>
                <th className="px-3.5 py-3 text-center">Status Insentif</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {FALLBACK_KPIS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3.5 py-2.5 font-bold text-slate-900">{item.empName}</td>
                  <td className="px-3.5 py-2.5">
                    <div className="font-semibold text-slate-800">{item.empRole}</div>
                    <div className="text-[10px] text-slate-500">{item.department}</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-slate-700">{item.targetKpi}</td>
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-emerald-700">
                    {item.achievement}%
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <span className="font-black text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {item.grade}
                    </span>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaBadge variant={item.bonusEligible ? "success" : "warning"}>
                      {item.bonusEligible ? "Eligible Bonus" : "Standard"}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton
                      variant="primary"
                      size="sm"
                      onClick={() => toast.success(`Detail KPI ${item.empName} dibuka`)}
                    >
                      Detail 360°
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>
    </DnaPageContainer>
  );
}
