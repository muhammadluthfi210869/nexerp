"use client";

import React from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle, Percent } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface QualityChecklistTrackingKpiCardsProps {
  totalCompleted: number;
  passedCount: number;
  deviationCount: number;
  avgPassRate: number;
}

export function QualityChecklistTrackingKpiCards({
  totalCompleted,
  passedCount,
  deviationCount,
  avgPassRate,
}: QualityChecklistTrackingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Kontrol Mutu Selesai"
        value={`${totalCompleted} Audit`}
        icon={ClipboardCheck}
        variant="blue"
      />
      <DnaStatCard
        label="Lolos Tanpa Deviasi"
        value={`${passedCount} Batch`}
        icon={CheckCircle2}
        variant="emerald"
      />
      <DnaStatCard
        label="Temuan Deviasi Aktif"
        value={`${deviationCount} Temuan`}
        icon={AlertTriangle}
        variant="rose"
      />
      <DnaStatCard
        label="Tingkat Kepatuhan Mutu"
        value={`${avgPassRate}%`}
        icon={Percent}
        variant="purple"
      />
    </DnaKpiGrid>
  );
}
