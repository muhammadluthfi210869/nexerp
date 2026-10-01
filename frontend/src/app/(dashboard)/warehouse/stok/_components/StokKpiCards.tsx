import React from "react";
import { DollarSign, Package, Layers, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import type { StokKpis } from "../_types/stok.types";

interface StokKpiCardsProps {
  kpis: StokKpis;
}

export function StokKpiCards({ kpis }: StokKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Nilai Valuasi FIFO"
        value={formatRupiah(kpis.totalValuation)}
        icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Total SKU Terdaftar"
        value={`${kpis.totalSkus} SKU`}
        icon={<Package className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Total Kuantitas Fisik"
        value={`${kpis.totalPhysicalQty.toLocaleString("id-ID")} Unit`}
        icon={<Layers className="w-5 h-5 text-purple-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Di Bawah Minimum"
        value={`${kpis.lowStockCount} SKU`}
        icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        variant={kpis.lowStockCount > 0 ? "warning" : "default"}
      />
    </DnaKpiGrid>
  );
}
