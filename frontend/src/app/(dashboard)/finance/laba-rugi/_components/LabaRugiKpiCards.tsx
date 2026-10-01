"use client";

import React from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowDownRight,
  PieChart,
  Sparkles,
} from "lucide-react";
import { DnaKpiGrid, formatRupiah } from "@/components/dna";
import type { LabaRugiKpis } from "../_types/laba-rugi.types";

interface LabaRugiKpiCardsProps {
  kpis: LabaRugiKpis;
}

export const LabaRugiKpiCards: React.FC<LabaRugiKpiCardsProps> = ({ kpis }) => {
  const {
    totalPendapatan,
    labaKotor,
    totalHpp,
    labaOperasional,
    labaBersih,
    grossMarginPct,
    netMarginPct,
  } = kpis;

  return (
    <DnaKpiGrid
      cols={5}
      cards={[
        {
          key: "TOTAL_REVENUE",
          title: "TOTAL PENDAPATAN OPERASIONAL",
          value: formatRupiah(totalPendapatan),
          icon: <DollarSign className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "LABA_OPERASIONAL",
          title: "LABA OPERASIONAL (EBIT)",
          value: formatRupiah(labaOperasional),
          icon: <PieChart className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "LABA_KOTOR",
          title: `LABA KOTOR (GROSS: ${grossMarginPct}%)`,
          value: formatRupiah(labaKotor),
          icon: <TrendingUp className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "TOTAL_HPP",
          title: "TOTAL HPP / COGS",
          value: formatRupiah(totalHpp),
          icon: <ArrowDownRight className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "LABA_BERSIH",
          title: `LABA BERSIH (NET: ${netMarginPct}%)`,
          value: formatRupiah(labaBersih),
          icon: <Sparkles className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
      ]}
    />
  );
};
