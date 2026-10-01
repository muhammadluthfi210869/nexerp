"use client";

import React from "react";
import { ShieldAlert, Flame, CheckCircle2, FileCheck } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";

interface KarantinaKpiCardsProps {
  totalInQuarantine: number;
  totalScrapValue: number;
  totalResolved: number;
  totalPendingCoa: number;
}

export function KarantinaKpiCards({
  totalInQuarantine,
  totalScrapValue,
  totalResolved,
  totalPendingCoa,
}: KarantinaKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Item Aktif di Karantina"
        value={`${totalInQuarantine} Batch`}
        icon={ShieldAlert}
        variant="rose"
      />
      <DnaStatCard
        label="Taksiran Nilai Scrap"
        value={formatRupiah(totalScrapValue)}
        icon={Flame}
        variant="amber"
      />
      <DnaStatCard
        label="Resolusi Selesai"
        value={`${totalResolved} Batch`}
        icon={CheckCircle2}
        variant="emerald"
      />
      <DnaStatCard
        label="Menunggu Verifikasi CoA"
        value={`${totalPendingCoa} Dokumen`}
        icon={FileCheck}
        variant="blue"
      />
    </DnaKpiGrid>
  );
}
