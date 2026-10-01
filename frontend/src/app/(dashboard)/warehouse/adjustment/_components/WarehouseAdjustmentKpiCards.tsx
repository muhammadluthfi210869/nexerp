"use client";

import React from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  DnaKpiGrid,
  DnaStatCard,
  formatRupiah,
} from "@/components/dna";
import type { AdjustmentKpis } from "../_types/adjustment.types";

interface WarehouseAdjustmentKpiCardsProps {
  kpis: AdjustmentKpis;
}

export function WarehouseAdjustmentKpiCards({ kpis }: WarehouseAdjustmentKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Dokumen Adjustment"
        value={`${kpis.total} Dokumen`}
        icon={<FileText className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "+2 minggu ini", isPositive: true }}
        variant="info"
      />
      <DnaStatCard
        label="Menunggu Approval"
        value={`${kpis.pending} Dokumen`}
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        subtext="Menunggu verifikasi persetujuan"
        variant={kpis.pending > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Adjustment Disetujui"
        value={`${kpis.approved} Dokumen`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        subtext="Tervalidasi & jurnal terbit"
        variant="success"
      />
      <DnaStatCard
        label="Net Varians Finansial"
        value={formatRupiah(kpis.netVariance)}
        icon={kpis.netVariance < 0 ? <TrendingDown className="w-5 h-5 text-red-500" /> : <TrendingUp className="w-5 h-5 text-emerald-600" />}
        subtext="Dampak COGS Buku Besar"
        variant={kpis.netVariance < 0 ? "warning" : "success"}
      />
    </DnaKpiGrid>
  );
}
