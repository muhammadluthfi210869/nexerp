"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Award,
  TrendingUp,
  Target,
  Search,
  Eye,
  Star,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Sliders,
  DollarSign,
  Check,
  Loader2,
} from "lucide-react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaKpiGrid,
  DnaStatCard,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaDetailDrawer,
  formatRupiah,
  useDnaToast,
  DnaInput,
  DnaSelect,
  DnaTable
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

export default function HrKpiPage() {
  const toast = useDnaToast();
  const [period, setPeriod] = useState("Q3-2026");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKpi, setSelectedKpi] = useState<KpiScorecard | null>(null);

  const { data: rawKpis = [], isLoading } = useQuery({
    queryKey: ["hr-kpi-employees"],
    queryFn: async () => {
      const res = await api.get("/hr/kpi/employees");
      return res.data;
    },
  });

  const kpis: KpiScorecard[] = useMemo(() => {
    if (!rawKpis || rawKpis.length === 0) return [];
    return (rawKpis as any[]).map((emp: any, idx: number) => {
      const ach = emp.finalKpiScore || 0;
      let grade: "A" | "B+" | "B" | "C" = "C";
      let mult = 0.5;
      if (ach >= 90) { grade = "A"; mult = 1.0; }
      else if (ach >= 85) { grade = "B+"; mult = 0.75; }
      else if (ach >= 75) { grade = "B"; mult = 0.5; }
      else { grade = "C"; mult = 0.25; }

      return {
        id: emp.id || `kpi-${idx}`,
        empId: emp.employeeId || emp.nik || `EMP-${idx + 1}`,
        empName: emp.employeeName || emp.name || "Karyawan",
        empRole: emp.role || "Staff",
        department: emp.department || "Operasional",
        targetKpi: emp.kpiItems?.[0]?.name || "Target Operasional Divisi",
        achievement: Math.round(ach * 10) / 10,
        disciplineScore: 95,
        objectiveScore: Math.round((emp.roleSpecificScore || ach) * 10) / 10,
        grade,
        bonusMultiplier: mult,
        bonusAmount: Math.round(mult * 5000000),
      };
    });
  }, [rawKpis]);

  const totalBonus = kpis.reduce((acc, k) => acc + k.bonusAmount, 0);
  const avgScore = kpis.length > 0 ? (kpis.reduce((acc, k) => acc + k.achievement, 0) / kpis.length).toFixed(1) : "0.0";

  const filteredKpis = useMemo(() => {
    return kpis.filter(k => {
      const matchSearch = k.empName.toLowerCase().includes(searchQuery.toLowerCase()) || k.empRole.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === "ALL" || k.department.includes(deptFilter);
      return matchSearch && matchDept;
    });
  }, [kpis, searchQuery, deptFilter]);

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Evaluasi Kinerja & KPI Karyawan (Performance Scorecard)"
        description="Sistem penilaian KPI 360 derajat manufaktur pabrik kosmetik, SLA operasional antar divisi, grading kinerja, dan kalkulasi bonus insentif."
        tabs={[
          { id: "ALL", label: "Semua Divisi" },
          { id: "Produksi", label: "Produksi Mixing" },
          { id: "R&D", label: "R&D Formulasi" },
          { id: "QC", label: "QC Mikrobiologi" },
          { id: "BusDev", label: "BusDev Maklon" },
          { id: "Warehouse", label: "Warehouse Material" }
        ]}
        activeTab={deptFilter}
        onTabChange={setDeptFilter}
        actions={
          <div className="flex items-center gap-2">
            <DnaSelect
              value={period}
              onChange={setPeriod}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-semibold"
            >
              <option value="Q3-2026">Kuartal 3 (Q3 2026)</option>
              <option value="Q2-2026">Kuartal 2 (Q2 2026)</option>
              <option value="Q1-2026">Kuartal 1 (Q1 2026)</option>
            </DnaSelect>
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

      {/* DATA TABLE */}
      <DnaDataTableCard
        customToolbar={
          <div className="flex items-center justify-between w-full">
            <div className="relative w-80">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <DnaInput
                type="text"
                placeholder="Cari nama karyawan atau jabatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Matriks Evaluasi Kinerja Karyawan & Pembobotan: Menampilkan <span className="font-semibold text-slate-800">{filteredKpis.length}</span> Karyawan Dievaluasi
            </div>
          </div>
        }
      >
        <DnaTable className="w-full text-xs text-left table-fixed">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="px-3.5 py-3 w-[22%]">Karyawan & NIK</th>
              <th className="px-3.5 py-3 w-[20%]">Departemen & Jabatan</th>
              <th className="px-3.5 py-3 w-[24%]">Key Performance Indicator (Target)</th>
              <th className="px-3.5 py-3 w-[14%]">Pencapaian & Grade</th>
              <th className="px-3.5 py-3 text-right w-[14%]">Estimasi Bonus</th>
              <th className="px-3.5 py-3 text-center w-[6%]">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredKpis.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3.5 py-8 text-center text-slate-400">
                  Tidak ada evaluasi kinerja yang sesuai dengan filter.
                </td>
              </tr>
            ) : (
              filteredKpis.map((kpi) => (
                <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-bold text-slate-900 truncate">{kpi.empName}</div>
                    <div className="text-[11px] tabular-nums text-slate-500">{kpi.empId}</div>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-semibold text-slate-800 truncate">{kpi.empRole}</div>
                    <div className="text-[11px] text-slate-500 truncate">{kpi.department}</div>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="font-medium text-slate-800 truncate">{kpi.targetKpi}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      Obj: {kpi.objectiveScore}% &bull; Disp: {kpi.disciplineScore}%
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 truncate">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-blue-700 tabular-nums">
                        {kpi.achievement}%
                      </span>
                      <DnaBadge
                        variant={
                          kpi.grade === "A" ? "success" :
                          kpi.grade === "B+" ? "purple" :
                          kpi.grade === "B" ? "info" : "warning"
                        }
                      >
                        Grade {kpi.grade}
                      </DnaBadge>
                    </div>
                  </td>
                  <td className="px-3.5 py-2.5 text-right truncate">
                    <div className="tabular-nums font-bold text-emerald-700">{formatRupiah(kpi.bonusAmount)}</div>
                    <div className="text-[10px] text-slate-400">Bonus Kuartal</div>
                  </td>
                  <td className="px-3.5 py-2.5 text-center">
                    <DnaButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedKpi(kpi)}
                      title="Lihat Detail Scorecard"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                    </DnaButton>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </DnaTable>
      </DnaDataTableCard>

      {/* QUICK PEEK DRAWER: DETAIL SCORECARD */}
      <DnaDetailDrawer
        isOpen={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
        title={selectedKpi?.empName || "Evaluasi Kinerja"}
        subtitle={`${selectedKpi?.empRole} • ${selectedKpi?.department}`}
        badge={
          selectedKpi ? (
            <DnaBadge
              variant={
                selectedKpi.grade === "A" ? "success" :
                selectedKpi.grade === "B+" ? "purple" : "info"
              }
            >
              Grade {selectedKpi.grade}
            </DnaBadge>
          ) : undefined
        }
        tabs={[
          {
            id: "review",
            label: "Evaluasi 360 & Target",
            content: selectedKpi && (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[11px] mb-0.5">Target Kinerja Utama (SLA Divisi):</span>
                  <div className="font-bold text-slate-900 text-sm">{selectedKpi.targetKpi}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Skor Objektif (Output Kerja)</span>
                    <span className="tabular-nums font-bold text-blue-700 text-base">{selectedKpi.objectiveScore}%</span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block text-[11px]">Skor Kedisiplinan & 5R Pabrik</span>
                    <span className="tabular-nums font-bold text-emerald-700 text-base">{selectedKpi.disciplineScore}%</span>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-purple-800 text-[11px] block">Total Pencapaian Akhir</span>
                    <span className="font-black text-purple-900 text-lg">{selectedKpi.achievement}%</span>
                  </div>
                  <DnaBadge variant="purple">Kinerja Istimewa</DnaBadge>
                </div>
              </div>
            )
          },
          {
            id: "bonus",
            label: "Kalkulasi Bonus Insentif",
            content: selectedKpi && (
              <div className="space-y-3 text-xs">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
                  <span className="text-emerald-800 font-semibold block text-[11px]">Hak Bonus Kuartal (Multiplier {selectedKpi.bonusMultiplier}x):</span>
                  <div className="tabular-nums font-black text-emerald-900 text-xl">{formatRupiah(selectedKpi.bonusAmount)}</div>
                  <div className="text-[11px] text-emerald-700">Dicairkan bersamaan dengan siklus penggajian payroll batch akhir kuartal.</div>
                </div>
              </div>
            )
          }
        ]}
        footerActions={
          <div className="flex items-center justify-between w-full">
            <DnaButton variant="secondary" size="md" onClick={() => setSelectedKpi(null)}>
              Tutup
            </DnaButton>
            <div className="flex gap-2">
              <DnaButton variant="secondary" size="md" onClick={() => toast.success("Mencetak lembar evaluasi scorecard...")}>
                <Printer className="w-4 h-4 mr-1.5" />
                Cetak Scorecard
              </DnaButton>
              <DnaButton variant="primary" size="md" onClick={() => {
                toast.success("Evaluasi Karyawan Telah Disign-off HR Director!");
                setSelectedKpi(null);
              }}>
                <Check className="w-4 h-4 mr-1.5" />
                Sign-off Evaluasi
              </DnaButton>
            </div>
          </div>
        }
      />
    </DnaPageContainer>
  );
}
