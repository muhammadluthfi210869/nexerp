"use client";

import React from "react";
import { Package, Clock, Beaker, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface SampleKpiCardsProps {
  totalCount: number;
  pendingLab: number;
  inProcess: number;
  approved: number;
}

export function SampleKpiCards({
  totalCount,
  pendingLab,
  inProcess,
  approved,
}: SampleKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "TOTAL",
          title: "TOTAL PERMINTAAN SAMPLE",
          value: `${totalCount} Sample`,
          deltaText: "Akumulasi siklus maklon",
          isDeltaPositive: true,
          icon: <Package className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "PENDING",
          title: "MENUNGGU LAB R&D",
          value: `${pendingLab} Antrean`,
          deltaText: "Antrean riset formulasi",
          isDeltaPositive: false,
          icon: <Clock className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "PROCESS",
          title: "SEDANG FORMULASI LAB",
          value: `${inProcess} Formula`,
          deltaText: "Trial & uji kestabilan",
          isDeltaPositive: true,
          icon: <Beaker className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "APPROVED",
          title: "SAMPLE DISETUJUI (APPROVED)",
          value: `${approved} Batch`,
          deltaText: "Siap lanjut legalitas & PO",
          isDeltaPositive: true,
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
      ]}
    />
  );
}
