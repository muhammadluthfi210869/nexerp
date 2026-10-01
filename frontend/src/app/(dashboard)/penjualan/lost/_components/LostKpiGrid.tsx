import React from "react";
import {
  XCircle,
  AlertTriangle,
  DollarSign,
  Users,
} from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface LostKpiGridProps {
  totalLostCount: number;
  totalChurnCount: number;
  totalLostValue: number;
}

export function LostKpiGrid({
  totalLostCount,
  totalChurnCount,
  totalLostValue,
}: LostKpiGridProps) {
  return (
    <DnaKpiGrid
      items={[
        {
          label: "Prospek Batal (Lost Deal)",
          value: `${totalLostCount} Prospek`,
          subtitle: "Gagal pada tahap negosiasi / sample",
          trend: "Fase Pipeline",
          icon: XCircle,
          variant: "critical",
        },
        {
          label: "Klien Churn (Pasca Delivery)",
          value: `${totalChurnCount} Klien`,
          subtitle: "Tidak ada repeat order > 6 bulan",
          trend: "Dormant",
          icon: Users,
          variant: "amber",
        },
        {
          label: "Estimasi Omset Hilang",
          value: formatCurrency(totalLostValue),
          subtitle: "Potensi revenue gagal konversi",
          trend: "Opportunity Loss",
          icon: DollarSign,
          variant: "blue",
        },
        {
          label: "Alasan Utama Pembatalan",
          value: totalLostCount > 0 ? "HPP & MOQ" : "Belum Ada",
          subtitle: "Sensitivitas harga & kuantiti batch",
          trend: "Evaluasi R&D",
          icon: AlertTriangle,
          variant: "purple",
        },
      ]}
    />
  );
}
