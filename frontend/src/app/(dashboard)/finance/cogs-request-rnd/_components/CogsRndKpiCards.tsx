"use client";

import React from "react";
import { Calculator, CheckCircle2, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface CogsRndKpiCardsProps {
  totalRequests: number;
  approvedCount: number;
  pendingCount: number;
}

export function CogsRndKpiCards({
  totalRequests,
  approvedCount,
  pendingCount,
}: CogsRndKpiCardsProps) {
  return (
    <DnaKpiGrid cols={3}>
      <DnaStatCard
        label="TOTAL PENGAJUAN HPP"
        value={`${totalRequests} Pengajuan`}
        subValue="Simulasi Biaya Maklon"
        icon={<Calculator className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="HPP DISETUJUI (APPROVED)"
        value={`${approvedCount} Disetujui`}
        subValue="Siap Rilis Penawaran (Quotation)"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="MENUNGGU APPROVAL MANAGEMENT"
        value={`${pendingCount} Pending`}
        subValue="Review Margin & Biaya Kemasan"
        icon={<Clock className="w-5 h-5 text-amber-600" />}
      />
    </DnaKpiGrid>
  );
}
