"use client";

import React from "react";
import { RotateCcw, ArrowRightLeft, Clock, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface ReturKpiCardsProps {
  totalReturnsCount: number;
  totalValue: number;
  inProcessCount: number;
  completedCount: number;
}

export function ReturKpiCards({
  totalReturnsCount,
  totalValue,
  inProcessCount,
  completedCount,
}: ReturKpiCardsProps) {
  return (
    <DnaKpiGrid
      items={[
        {
          label: "Total Klaim Retur",
          value: totalReturnsCount,
          subtitle: "Akumulasi komplain batch",
          trend: "0.8% dari volume kirim",
          icon: RotateCcw,
          variant: "blue",
        },
        {
          label: "Nilai Pemulihan (Kredit)",
          value: `Rp ${(totalValue / 1000000).toFixed(1)} Jt`,
          subtitle: "Potensi nota kredit invoice",
          trend: "Rekonsiliasi aktif",
          icon: ArrowRightLeft,
          variant: "purple",
        },
        {
          label: "Dalam Inspeksi QC",
          value: inProcessCount,
          subtitle: "Di gudang karantina",
          trend: "Butuh uji lab",
          icon: Clock,
          variant: "amber",
        },
        {
          label: "Retur Selesai (Di-Offset)",
          value: completedCount,
          subtitle: "Tagihan telah disesuaikan",
          trend: "Terselesaikan",
          icon: CheckCircle2,
          variant: "emerald",
        },
      ]}
    />
  );
}
