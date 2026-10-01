"use client";

import React from "react";
import { FileText, DollarSign, Scale, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, formatRupiah } from "@/components/dna";

interface JurnalUmumKpiCardsProps {
  totalJournals: number;
  totalDebitBulanIni: number;
  totalCreditBulanIni: number;
}

export function JurnalUmumKpiCards({
  totalJournals,
  totalDebitBulanIni,
  totalCreditBulanIni,
}: JurnalUmumKpiCardsProps) {
  const isBalanced = totalDebitBulanIni === totalCreditBulanIni;

  return (
    <DnaKpiGrid
      cols={4}
      cards={[
        {
          key: "TOTAL_JURNAL",
          title: "TOTAL VOUCHER JURNAL",
          value: totalJournals.toLocaleString("id-ID"),
          icon: <FileText className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "TOTAL_DEBIT",
          title: "TOTAL PERPUTARAN DEBIT",
          value: formatRupiah(totalDebitBulanIni),
          icon: <DollarSign className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "TOTAL_KREDIT",
          title: "TOTAL PERPUTARAN KREDIT",
          value: formatRupiah(totalCreditBulanIni),
          icon: <DollarSign className="w-4 h-4" />,
          iconBg: "bg-rose-50",
          iconColor: "text-rose-600",
        },
        {
          key: "STATUS_BALANCE",
          title: "STATUS KESEIMBANGAN",
          value: isBalanced ? "SEIMBANG (100%)" : "SELISIH (UNBALANCED)",
          icon: isBalanced ? <CheckCircle2 className="w-4 h-4" /> : <Scale className="w-4 h-4" />,
          iconBg: isBalanced ? "bg-purple-50" : "bg-amber-50",
          iconColor: isBalanced ? "text-purple-600" : "text-amber-600",
        },
      ]}
    />
  );
}
