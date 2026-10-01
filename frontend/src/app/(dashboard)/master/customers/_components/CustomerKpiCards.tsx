"use client";

import React from "react";
import { FlaskConical, Factory, ShieldCheck, RefreshCw, Sparkles } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import type { CustomerKpiFilterType } from "../_types/customer.types";

interface CustomerKpiCardsProps {
  totalSampleFee: number;
  totalProduksiSo: number;
  totalEscrow: number;
  totalRoCount: number;
  totalLeadsCount: number;
}

export function CustomerKpiCards({
  totalSampleFee,
  totalProduksiSo,
  totalEscrow,
  totalRoCount,
  totalLeadsCount,
}: CustomerKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "SAMPLE",
          title: "TOTAL SAMPLE FEE",
          value: `Rp ${(totalSampleFee / 1_000_000).toFixed(1)} Jt`,
          icon: <FlaskConical className="w-4 h-4" />,
          iconBg: "bg-purple-50",
          iconColor: "text-purple-600",
        },
        {
          key: "PRODUKSI",
          title: "TOTAL PRODUKSI (JO)",
          value: `Rp ${(totalProduksiSo / 1_000_000).toFixed(1)} Jt`,
          icon: <Factory className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
        {
          key: "ESCROW",
          title: "LEGALITAS & ESCROW",
          value: `Rp ${(totalEscrow / 1_000_000).toFixed(1)} Jt`,
          icon: <ShieldCheck className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "RO",
          title: "PELANGGAN REPEAT ORDER",
          value: `${totalRoCount} Klien`,
          icon: <RefreshCw className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "LEADS",
          title: "CALON PELANGGAN (LEADS)",
          value: `${totalLeadsCount} Leads`,
          icon: <Sparkles className="w-4 h-4" />,
          iconBg: "bg-indigo-50",
          iconColor: "text-indigo-600",
        },
      ]}
    />
  );
}
