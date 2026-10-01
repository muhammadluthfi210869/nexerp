"use client";

import React from "react";
import { BookOpen, TrendingUp, Scale, Building2 } from "lucide-react";
import { DnaKpiGrid, formatRupiah } from "@/components/dna";
import { LedgerKpiStats } from "../_types/ledger.types";

export function LedgerKpiCards({ kpis }: { kpis: LedgerKpiStats }) {
  return (
    <DnaKpiGrid
      cols={4}
      cards={[
        {
          key: "OPENING",
          title: "OPENING BALANCE (SALDO AWAL)",
          value: formatRupiah(kpis.openingBalance),
          icon: <BookOpen className="w-4 h-4" />,
          iconBg: "bg-slate-100",
          iconColor: "text-slate-700",
        },
        {
          key: "TOTAL_DEBIT",
          title: "TOTAL MUTASI DEBIT",
          value: formatRupiah(kpis.totalDebit),
          icon: <TrendingUp className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "TOTAL_KREDIT",
          title: "TOTAL MUTASI KREDIT",
          value: formatRupiah(kpis.totalCredit),
          icon: <Scale className="w-4 h-4" />,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-600",
        },
        {
          key: "CLOSING",
          title: "CLOSING BALANCE (SALDO AKHIR)",
          value: formatRupiah(kpis.closingBalance),
          icon: <Building2 className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
      ]}
    />
  );
}
