"use client";

import React from "react";
import { DollarSign, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface DpKpiCardsProps {
  activeTab: string;
  totalAmount: number;
  totalRemaining: number;
  totalUsed: number;
  conversionRate: number;
  count: number;
}

export function DpKpiCards({
  activeTab,
  totalAmount,
  totalRemaining,
  totalUsed,
  conversionRate,
  count,
}: DpKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: `TOTAL DP ${activeTab.toUpperCase()}`,
          value: `Rp ${(totalAmount / 1000000).toFixed(1)} Jt`,
          deltaText: `${count} transaksi penerimaan`,
          isDeltaPositive: true,
          icon: <DollarSign className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "REMAINING",
          title: "SISA SALDO UNUSED",
          value: `Rp ${(totalRemaining / 1000000).toFixed(1)} Jt`,
          deltaText: "Siap kompensasi ke faktur",
          isDeltaPositive: true,
          icon: <Wallet className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "USED",
          title: "DP TERPAKAI / TERPOTONG",
          value: `Rp ${(totalUsed / 1000000).toFixed(1)} Jt`,
          deltaText: "Telah di-offset ke faktur",
          isDeltaPositive: true,
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "CONVERSION",
          title: "RASIO REALISASI",
          value: `${conversionRate}%`,
          deltaText: "Tingkat pemotongan tagihan",
          isDeltaPositive: true,
          icon: <TrendingUp className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
      ]}
    />
  );
}
