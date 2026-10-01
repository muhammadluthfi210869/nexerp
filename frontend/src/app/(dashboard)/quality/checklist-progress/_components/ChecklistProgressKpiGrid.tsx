"use client";

import React from "react";
import { ListChecks, Target, CheckCircle2, AlertTriangle } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface ChecklistProgressKpiGridProps {
  totalChecklists: number;
  avgProgress: number;
  completedCount: number;
  overdueCount: number;
}

export function ChecklistProgressKpiGrid({
  totalChecklists,
  avgProgress,
  completedCount,
  overdueCount,
}: ChecklistProgressKpiGridProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: "TOTAL CHECKLIST",
          value: `${totalChecklists} Dokumen`,
          subtext: "Seluruh pos pengawasan mutu",
          icon: <ListChecks className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "AVG",
          title: "RATA-RATA PROGRES",
          value: `${avgProgress}%`,
          subtext: "Penyelesaian inspeksi",
          icon: <Target className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "DONE",
          title: "INSPEKSI SELESAI",
          value: `${completedCount} Checklist`,
          subtext: "100% Parameter lolos",
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "OVERDUE",
          title: "TERLAMBAT / OVERDUE",
          value: `${overdueCount} Checklist`,
          subtext: "Melewati batas SLA QC",
          icon: <AlertTriangle className="w-4 h-4" />,
          iconBg: overdueCount > 0 ? "bg-rose-50" : "bg-slate-100",
          iconColor: overdueCount > 0 ? "text-rose-600" : "text-slate-500",
        },
      ]}
    />
  );
}
