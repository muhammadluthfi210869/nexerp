"use client";

import React from "react";
import { FileText, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { BatchRecordKpis } from "../_types/batch-records.types";

interface BatchRecordsKpiCardsProps {
  kpis: BatchRecordKpis;
}

export function BatchRecordsKpiCards({ kpis }: BatchRecordsKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Batch Records (BMR)"
        value={`${kpis.totalRecords} Dokumen`}
        icon={<FileText className="w-5 h-5 text-indigo-600" />}
        variant="default"
      />
      <DnaStatCard
        label="Menunggu / Uji QC"
        value={`${kpis.pendingQcCount} Batch`}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        variant="warning"
      />
      <DnaStatCard
        label="Lolos Release QC"
        value={`${kpis.releasedCount} Batch`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Rata-rata Yield Realisasi"
        value={`${kpis.avgYieldPct}%`}
        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
    </DnaKpiGrid>
  );
}
