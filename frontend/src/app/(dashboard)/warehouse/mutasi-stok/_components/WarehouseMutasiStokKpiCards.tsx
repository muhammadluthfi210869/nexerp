"use client";

import React from "react";
import { TrendingUp, TrendingDown, ArrowRightLeft, Layers } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { MutasiStokKpis } from "../_types/mutasi-stok.types";

interface WarehouseMutasiStokKpiCardsProps {
  kpis: MutasiStokKpis;
}

export function WarehouseMutasiStokKpiCards({ kpis }: WarehouseMutasiStokKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Volume Masuk (Inbound)"
        value={`${kpis.totalInbound.toLocaleString("id-ID")} Unit`}
        icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
        subtext="Penerimaan Bahan Supplier"
        variant="success"
      />
      <DnaStatCard
        label="Total Volume Keluar (SPK)"
        value={`${kpis.totalOutbound.toLocaleString("id-ID")} Unit`}
        icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
        subtext="Pengeluaran Mixing & Kemas"
        variant="warning"
      />
      <DnaStatCard
        label="Transfer Antar Gudang"
        value={`${kpis.totalTransfer.toLocaleString("id-ID")} Unit`}
        icon={<ArrowRightLeft className="w-5 h-5 text-blue-600" />}
        subtext="Relokasi Gudang Transit & Staging"
        variant="info"
      />
      <DnaStatCard
        label="Penyesuaian & Opname"
        value={`${kpis.totalAdjustment.toLocaleString("id-ID")} Unit`}
        icon={<Layers className="w-5 h-5 text-purple-600" />}
        subtext="Akurasi Fisik vs Sistem Terjaga"
        variant="purple"
      />
    </DnaKpiGrid>
  );
}
