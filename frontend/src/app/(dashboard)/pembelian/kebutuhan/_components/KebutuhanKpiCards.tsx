"use client";

import React from "react";
import { Layers, AlertTriangle, DollarSign, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface KebutuhanKpiCardsProps {
  totalCount: number;
  deficitCount: number;
  totalDeficitCost: number;
  safeCount: number;
}

export function KebutuhanKpiCards({
  totalCount,
  deficitCount,
  totalDeficitCost,
  safeCount,
}: KebutuhanKpiCardsProps) {
  return (
    <DnaKpiGrid
      items={[
        {
          label: "Total Bahan Terjadwal",
          value: `${totalCount} Bahan/Kemas`,
          subtitle: "Diperlukan untuk seluruh SO aktif",
          trend: "Terpetakan BOM",
          icon: Layers,
          variant: "blue",
        },
        {
          label: "Bahan Defisit (Perlu PO)",
          value: `${deficitCount} Item Kurang`,
          subtitle: "Stok gudang di bawah kebutuhan SO",
          trend: "Prioritas SCM",
          icon: AlertTriangle,
          variant: "rose",
        },
        {
          label: "Estimasi Anggaran PO Defisit",
          value: formatCurrency(totalDeficitCost),
          subtitle: "Biaya pengadaan untuk menutup defisit",
          trend: "Kalkulasi Otomatis",
          icon: DollarSign,
          variant: "amber",
        },
        {
          label: "Bahan Siap Produksi (Aman)",
          value: `${safeCount} Item Tersedia`,
          subtitle: "Real stok & on-order mencukupi",
          trend: "Siap Mixing/Pack",
          icon: CheckCircle2,
          variant: "emerald",
        },
      ]}
    />
  );
}
