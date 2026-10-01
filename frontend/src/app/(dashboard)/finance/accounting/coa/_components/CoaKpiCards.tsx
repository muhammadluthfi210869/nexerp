"use client";

import React from "react";
import {
  FileSpreadsheet,
  Wallet,
  TrendingDown,
  TrendingUp,
  CreditCard,
} from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { CoaKpis } from "../_types/coa.types";

export function CoaKpiCards({
  kpis,
}: {
  kpis: CoaKpis;
}) {
  return (
    <DnaKpiGrid
      cols={5}
      cards={[
        {
          key: "ALL",
          title: "TOTAL AKUN BUKU BESAR",
          value: kpis.totalAccounts.toLocaleString("id-ID"),
          icon: <FileSpreadsheet className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "ASSET",
          title: "ASET & PERSEDIAAN",
          value: kpis.assetCount.toLocaleString("id-ID"),
          icon: <Wallet className="w-4 h-4" />,
          iconBg: "bg-cyan-50",
          iconColor: "text-cyan-600",
        },
        {
          key: "LIABILITY",
          title: "KEWAJIBAN & AP",
          value: kpis.liabilityCount.toLocaleString("id-ID"),
          icon: <TrendingDown className="w-4 h-4" />,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-600",
        },
        {
          key: "REVENUE",
          title: "PENDAPATAN MAKLON",
          value: kpis.revenueCount.toLocaleString("id-ID"),
          icon: <TrendingUp className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "EXPENSE",
          title: "HPP & BEBAN OPERASI",
          value: kpis.expenseCount.toLocaleString("id-ID"),
          icon: <CreditCard className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
      ]}
    />
  );
}
