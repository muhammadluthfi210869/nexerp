"use client";

import React from "react";
import { SlidersHorizontal, AlertTriangle, CheckCircle2, Warehouse } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface AdjustmentKpiCardsProps {
  totalAdjustments: number;
  totalDeficit: number;
  totalSurplus: number;
}

export function AdjustmentKpiCards({
  totalAdjustments,
  totalDeficit,
  totalSurplus,
}: AdjustmentKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Dokumen Penyesuaian"
        value={totalAdjustments.toString()}
        icon={SlidersHorizontal}
        variant="default"
        subtext="Akumulasi adjustment terbit"
      />
      <DnaStatCard
        title="Item Susut / Defisit"
        value={totalDeficit.toString()}
        icon={AlertTriangle}
        variant="danger"
        subtext="Koreksi stok berkurang"
      />
      <DnaStatCard
        title="Item Surplus / Bonus"
        value={totalSurplus.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Penambahan stok bebas HPP"
      />
      <DnaStatCard
        title="Gudang Terverifikasi"
        value="Semua Lokasi"
        icon={Warehouse}
        variant="info"
        subtext="Posting otomatis ke COA 5100"
      />
    </DnaKpiGrid>
  );
}
