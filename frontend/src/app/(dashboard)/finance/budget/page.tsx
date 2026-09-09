"use client";

import React, { useState } from "react";
import {
  DnaPageContainer,
  DnaPageHeader,
  DnaStatCard,
  DnaKpiGrid,
  DnaDataTableCard,
  DnaButton,
  DnaBadge,
  DnaCell,
  DnaCrudModal,
  DnaInput,
  DnaCurrencyInput,
  formatRupiah,
} from "@/components/dna";
import { Plus, PieChart, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

interface DepartmentBudget {
  id: string;
  department: string;
  year: number;
  allocatedBudget: number;
  actualSpent: number;
  committedAmount: number;
  variance: number;
  utilizationRate: number;
}

const SAMPLE_BUDGETS: DepartmentBudget[] = [
  { id: "b-1", department: "R&D Formulasi & Uji Lab", year: 2026, allocatedBudget: 350000000, actualSpent: 185000000, committedAmount: 45000000, variance: 120000000, utilizationRate: 65.7 },
  { id: "b-2", department: "Operasional Pabrik & Maintenance", year: 2026, allocatedBudget: 750000000, actualSpent: 520000000, committedAmount: 80000000, variance: 150000000, utilizationRate: 80.0 },
  { id: "b-3", department: "Digital Marketing & Ads Spend", year: 2026, allocatedBudget: 400000000, actualSpent: 310000000, committedAmount: 50000000, variance: 40000000, utilizationRate: 90.0 },
  { id: "b-4", department: "Supply Chain & Logistik", year: 2026, allocatedBudget: 250000000, actualSpent: 120000000, committedAmount: 30000000, variance: 100000000, utilizationRate: 60.0 },
  { id: "b-5", department: "HRD & Rekrutmen Pabrik", year: 2026, allocatedBudget: 180000000, actualSpent: 95000000, committedAmount: 15000000, variance: 70000000, utilizationRate: 61.1 },
];

export default function BudgetManagementPage() {
  const [budgets, setBudgets] = useState<DepartmentBudget[]>(SAMPLE_BUDGETS);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalAllocated = budgets.reduce((acc, b) => acc + b.allocatedBudget, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.actualSpent, 0);
  const totalVariance = totalAllocated - totalSpent;
  const overallUtil = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  return (
    <DnaPageContainer>
      <DnaPageHeader
        title="Anggaran Departemen & Budget vs Actual"
        subtitle="Penetapan pagu anggaran tahunan per divisi dan pengendalian penyerapan biaya real-time"
        breadcrumbs={[{ label: "Finance", href: "/finance/dashboard" }, { label: "Budgeting" }]}
        actions={
          <DnaButton variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> + Alokasi Anggaran Baru
          </DnaButton>
        }
      />

      <DnaKpiGrid cols={4}>
        <DnaStatCard
          label="Total Pagu Anggaran Tahunan"
          value={formatRupiah(totalAllocated)}
          variant="blue"
          icon={<PieChart className="h-4 w-4" />}
          delta={{ value: `Tahun Anggaran ${selectedYear}`, isPositive: true }}
        />
        <DnaStatCard
          label="Realisasi Biaya Aktual (Spent)"
          value={formatRupiah(totalSpent)}
          variant="amber"
          icon={<TrendingUp className="h-4 w-4" />}
          delta={{ value: `${overallUtil.toFixed(1)}% Terserap`, isPositive: true }}
        />
        <DnaStatCard
          label="Sisa Pagu Anggaran (Variance)"
          value={formatRupiah(totalVariance)}
          variant="emerald"
          icon={<CheckCircle2 className="h-4 w-4" />}
          delta={{ value: "Saldo Aman Tersedia", isPositive: true }}
        />
        <DnaStatCard
          label="Status Kontrol Anggaran"
          value={overallUtil < 85 ? "ON TRACK" : "ALERT TINGGI"}
          variant={overallUtil < 85 ? "emerald" : "danger"}
          icon={<AlertTriangle className="h-4 w-4" />}
          delta={{ value: "Tidak Ada Over-Budget", isPositive: true }}
        />
      </DnaKpiGrid>

      <DnaDataTableCard title="Tabel Pengawasan Realisasi Anggaran per Departemen">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Departemen / Divisi</th>
                <th className="px-4 py-3 text-right">Pagu Anggaran</th>
                <th className="px-4 py-3 text-right">Realisasi Aktual</th>
                <th className="px-4 py-3 text-right">Komitmen PO</th>
                <th className="px-4 py-3 text-right">Sisa Anggaran</th>
                <th className="px-4 py-3">Penyerapan (%)</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {budgets.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{b.department}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900">{formatRupiah(b.allocatedBudget)}</td>
                  <td className="px-4 py-3 text-right font-mono font-medium text-amber-700">{formatRupiah(b.actualSpent)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-500">{formatRupiah(b.committedAmount)}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{formatRupiah(b.variance)}</td>
                  <td className="px-4 py-3">
                    <div className="w-36 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>{b.utilizationRate}%</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.utilizationRate > 85 ? "bg-rose-500" : b.utilizationRate > 70 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(b.utilizationRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <DnaBadge variant={b.utilizationRate > 85 ? "danger" : b.utilizationRate > 70 ? "amber" : "emerald"}>
                      {b.utilizationRate > 85 ? "Mendekati Batas" : "Normal"}
                    </DnaBadge>
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
