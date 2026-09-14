"use client";

import React, { useState } from "react";
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
  Sparkles,
  Sliders,
  DollarSign
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaTabNav,
  DnaButton,
  DnaBadge,
  DnaModal,
  formatRupiah,
  useDnaToast
} from "@/components/dna";

interface KpiScorecard {
  id: string;
  empId: string;
  empName: string;
  empRole: string;
  department: string;
  targetKpi: string;
  achievement: number; // percentage
  disciplineScore: number;
  objectiveScore: number;
  grade: "A" | "B+" | "B" | "C";
  bonusMultiplier: number;
  bonusAmount: number;
}

const INITIAL_KPIS: KpiScorecard[] = [
  { id: "KPI-01", empId: "KIL-2022-001", empName: "Budi Santoso, S.T", empRole: "Supervisor Produksi", department: "Produksi Mixing", targetKpi: "Zero Batch Scrap & OEE > 85%", achievement: 95.4, disciplineScore: 98, objectiveScore: 94, grade: "A", bonusMultiplier: 1.0, bonusAmount: 6500000 },
  { id: "KPI-02", empId: "KIL-2023-014", empName: "Rian Saputra, S.Farm", empRole: "Senior Formulator", department: "R&D Formulasi", targetKpi: "Lead Time Sample < 5 Hari", achievement: 92.0, disciplineScore: 96, objectiveScore: 90, grade: "A", bonusMultiplier: 1.0, bonusAmount: 8000000 },
  { id: "KPI-03", empId: "KIL-2023-022", empName: "Siti Rahmawati, S.Si", empRole: "QC Inspector", department: "QC Mikrobiologi", targetKpi: "COA Release SLA < 24 Jam", achievement: 88.5, disciplineScore: 90, objectiveScore: 87, grade: "B+", bonusMultiplier: 0.75, bonusAmount: 4125000 },
  { id: "KPI-04", empId: "KIL-2024-005", empName: "Dewi Lestari, S.E", empRole: "Senior AE BusDev", department: "BusDev Maklon", targetKpi: "Monthly Deals > Rp 800 Juta", achievement: 104.2, disciplineScore: 100, objectiveScore: 106, grade: "A", bonusMultiplier: 1.0, bonusAmount: 7000000 },
  { id: "KPI-05", empId: "KIL-2024-031", empName: "Ahmad Dani", empRole: "Staff Inbound", department: "Warehouse Material", targetKpi: "Akurasi Stock Opname > 99%", achievement: 82.0, disciplineScore: 88, objectiveScore: 79, grade: "B", bonusMultiplier: 0.5, bonusAmount: 2400000 },
];

export default function HrKpiPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("Q3-2026");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpi, setSelectedKpi] = useState<KpiScorecard | null>(null);

  const totalBonus = INITIAL_KPIS.reduce((acc, k) => acc + k.bonusAmount, 0);
  const avgScore = (INITIAL_KPIS.reduce((acc, k) => acc + k.achievement, 0) / INITIAL_KPIS.length).toFixed(1);

  const filteredKpis = INITIAL_KPIS.filter(k => {
    const matchSearch = k.empName.toLowerCase().includes(searchQuery.toLowerCase()) || k.empRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDept = deptFilter === "ALL" || k.department.includes(deptFilter);
    return matchSearch && matchDept;
  });

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Evaluasi Kinerja & KPI Karyawan (Performance Scorecard)"
        description="Sistem penilaian KPI 360 derajat manufaktur pabrik kosmetik, SLA operasional antar divisi, grading kinerja, dan kalkulasi bonus insentif."
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
            <DnaButton variant="secondary" size="md" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Scorecard
            </DnaButton>
            <DnaButton variant="primary" size="md" onClick={() => toast.success("Kalkulasi Grading & Bonus Kinerja Periode " + period + " Selesai!")}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Proses Grading & Bonus
            </DnaButton>
          </div>
        }
      />

      {/* KPI STAT CARDS */}
      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Rata-rata Skor KPI Pabrik"
          value={avgScore + "%"}
          icon={<Target className="w-5 h-5 text-emerald-600" />}
          delta={{ value: "+2.4% vs Q2", isPositive: true }}
          subtext="Target KPI Perusahaan Tercapai"
          variant="success"
        />
        <DnaStatCard
          label="Karyawan Grade A (Top)"
          value="38 Orang"
          icon={<Award className="w-5 h-5 text-purple-600" />}
          subtext="Pencapaian Skor > 90%"
          variant="purple"
        />
        <DnaStatCard
          label="Total Alokasi Bonus Kinerja"
          value={formatRupiah(totalBonus)}
          icon={<DollarSign className="w-5 h-5 text-blue-600" />}
          delta={{ value: "5 Karyawan Terpilih", isPositive: true }}
          subtext="Insentif Prestasi Kuartalan"
          variant="info"
        />
        <DnaStatCard
          label="Tingkat Disiplin Pabrik"
          value="95.6%"
          icon={<CheckCircle2 className="w-5 h-5 text-amber-600" />}
          subtext="Presensi & Keselamatan 5R"
          variant="warning"
        />
      </DnaKpiGrid>

      {/* TABLE DATA */}
      <DnaDataTableCard
        title="Matriks Evaluasi Kinerja Karyawan & Pembobotan"
        badge={<DnaBadge variant="purple">{filteredKpis.length} Karyawan</DnaBadge>}
        customToolbar={
          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau divisi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-semibold"
            >
              <option value="ALL">Semua Departemen</option>
              <option value="Produksi">Produksi Mixing</option>
              <option value="R&D">R&D Formulasi</option>
              <option value="QC">QC Mikrobiologi</option>
              <option value="BusDev">BusDev</option>
              <option value="Warehouse">Warehouse</option>
            </select>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Karyawan & NIK</th>
                <th className="px-3.5 py-3">Departemen & Jabatan</th>
                <th className="px-3.5 py-3">Key Performance Indicator (Target)</th>
                <th className="px-3.5 py-3 text-center">Disiplin</th>
                <th className="px-3.5 py-3 text-center">Objektif</th>
                <th className="px-3.5 py-3 text-center">Pencapaian Akhir</th>
                <th className="px-3.5 py-3 text-center">Grade</th>
                <th className="px-3.5 py-3 text-right">Estimasi Bonus</th>
                <th className="px-3.5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredKpis.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3.5 py-3">
                    <div className="font-bold text-slate-900">{kpi.empName}</div>
                    <div className="text-[11px] font-mono text-slate-500">{kpi.empId}</div>
                  </td>
                  <td className="px-3.5 py-3">
                    <div className="font-semibold text-slate-800">{kpi.empRole}</div>
                    <div className="text-[11px] text-slate-500">{kpi.department}</div>
                  </td>
                  <td className="px-3.5 py-3 text-slate-700 font-medium">
                    {kpi.targetKpi}
                  </td>
                  <td className="px-3.5 py-3 text-center font-mono font-semibold text-slate-700">
                    {kpi.disciplineScore}%
                  </td>
                  <td className="px-3.5 py-3 text-center font-mono font-semibold text-slate-700">
                    {kpi.objectiveScore}%
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <span className="font-black text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 font-mono">
                      {kpi.achievement}%
                    </span>
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <DnaBadge
                      variant={
                        kpi.grade === "A" ? "success" :
                        kpi.grade === "B+" ? "purple" :
                        kpi.grade === "B" ? "info" : "warning"
                      }
                    >
                      Grade {kpi.grade}
                    </DnaBadge>
                  </td>
                  <td className="px-3.5 py-3 text-right font-mono font-bold text-emerald-700">
                    {formatRupiah(kpi.bonusAmount)}
                  </td>
                  <td className="px-3.5 py-3 text-center">
                    <DnaButton variant="ghost" size="sm" onClick={() => setSelectedKpi(kpi)}>
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Detail
                    </DnaButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DnaDataTableCard>

      {/* MODAL: DETAIL SCORECARD */}
      <DnaModal
        isOpen={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
        title={"Rincian Evaluasi Kinerja: " + (selectedKpi?.empName || "")}
        maxWidth="max-w-lg"
      >
        {selectedKpi && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="font-bold text-sm text-slate-900">{selectedKpi.empName}</div>
              <div className="text-slate-500 font-medium">{selectedKpi.empRole} • {selectedKpi.department}</div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-600 font-medium">Target Utama (SLA Divisi):</span>
                <span className="font-bold text-slate-900">{selectedKpi.targetKpi}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-600 font-medium">Skor Objektif (Output Produksi/Lab):</span>
                <span className="font-mono font-bold text-blue-700">{selectedKpi.objectiveScore}%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-lg">
                <span className="text-slate-600 font-medium">Skor Kedisiplinan & 5R Pabrik:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedKpi.disciplineScore}%</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                <span className="text-purple-900 font-bold">Total Pencapaian Akhir:</span>
                <span className="font-mono font-black text-purple-900 text-sm">{selectedKpi.achievement}% (Grade {selectedKpi.grade})</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-emerald-800 font-semibold block text-[11px]">Insentif Bonus Kuartal (100%):</span>
                <span className="font-mono font-bold text-emerald-900 text-sm">{formatRupiah(selectedKpi.bonusAmount)}</span>
              </div>
              <DnaBadge variant="success">Eligible</DnaBadge>
            </div>

            <div className="flex justify-end pt-2">
              <DnaButton variant="secondary" size="md" onClick={() => setSelectedKpi(null)}>
                Tutup
              </DnaButton>
            </div>
          </div>
        )}
      </DnaModal>
    </DnaPageContainer>
  );
}
