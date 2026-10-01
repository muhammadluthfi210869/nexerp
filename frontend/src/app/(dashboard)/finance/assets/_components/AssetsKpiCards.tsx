import React from "react";
import { DollarSign, TrendingDown, Building2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";

interface AssetsKpiCardsProps {
  totalCost: number;
  totalDeprec: number;
  totalBookValue: number;
  assetCount: number;
}

export function AssetsKpiCards({
  totalCost,
  totalDeprec,
  totalBookValue,
  assetCount,
}: AssetsKpiCardsProps) {
  return (
    <DnaKpiGrid cols={3}>
      <DnaStatCard
        label="Total Nilai Perolehan Aset (Cost)"
        value={formatRupiah(totalCost)}
        icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        delta={{ value: `${assetCount} Item Terdaftar`, isPositive: true }}
        subtext="Akumulasi Nilai Beli Seluruh Aset"
        variant="info"
      />
      <DnaStatCard
        label="Total Akumulasi Penyusutan"
        value={formatRupiah(totalDeprec)}
        icon={<TrendingDown className="w-5 h-5 text-amber-600" />}
        delta={{ value: "Garis Lurus (Straight Line)", isPositive: false }}
        subtext="Penyusutan Berjalan Terposting"
        variant="warning"
      />
      <DnaStatCard
        label="Total Nilai Buku Bersih (Book Value)"
        value={formatRupiah(totalBookValue)}
        icon={<Building2 className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "Net Asset Worth", isPositive: true }}
        subtext="Nilai Tercatat di Neraca Keuangan"
        variant="success"
      />
    </DnaKpiGrid>
  );
}
