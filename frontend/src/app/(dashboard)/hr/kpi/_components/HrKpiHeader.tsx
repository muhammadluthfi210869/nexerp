"use client";

import React from "react";
import { Printer, Sparkles } from "lucide-react";
import { DnaPageHeader, DnaButton, DnaSelect } from "@/components/dna";

interface HrKpiHeaderProps {
  period: string;
  onPeriodChange: (period: string) => void;
  deptFilter: string;
  onDeptFilterChange: (dept: string) => void;
  onPrint: () => void;
  onProcessGradingBonus: () => void;
}

export function HrKpiHeader({
  period,
  onPeriodChange,
  deptFilter,
  onDeptFilterChange,
  onPrint,
  onProcessGradingBonus,
}: HrKpiHeaderProps) {
  return (
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
      onTabChange={onDeptFilterChange}
      actions={
        <div className="flex items-center gap-2">
          <DnaSelect
            value={period}
            onChange={onPeriodChange}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white shadow-sm font-semibold"
          >
            <option value="Q3-2026">Kuartal 3 (Q3 2026)</option>
            <option value="Q2-2026">Kuartal 2 (Q2 2026)</option>
            <option value="Q1-2026">Kuartal 1 (Q1 2026)</option>
          </DnaSelect>
          <DnaButton variant="secondary" size="md" onClick={onPrint}>
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Scorecard
          </DnaButton>
          <DnaButton variant="primary" size="md" onClick={onProcessGradingBonus}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            Proses Grading & Bonus
          </DnaButton>
        </div>
      }
    />
  );
}
