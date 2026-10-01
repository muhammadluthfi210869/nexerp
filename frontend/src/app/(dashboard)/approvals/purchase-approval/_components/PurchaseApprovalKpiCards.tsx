"use client";

import React from "react";
import { FileText, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";

interface PurchaseApprovalKpiCardsProps {
  totalSubmissions: number;
  pendingCount: number;
  approvedCount: number;
  totalValue: number;
}

export function PurchaseApprovalKpiCards({
  totalSubmissions,
  pendingCount,
  approvedCount,
  totalValue,
}: PurchaseApprovalKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Pengajuan"
        value={totalSubmissions}
        icon={FileText}
        variant="blue"
      />
      <DnaStatCard
        label="Menunggu Persetujuan"
        value={pendingCount}
        icon={Clock}
        variant="amber"
      />
      <DnaStatCard
        label="Disetujui"
        value={approvedCount}
        icon={CheckCircle2}
        variant="emerald"
      />
      <DnaStatCard
        label="Total Nilai Pengajuan"
        value={formatRupiah(totalValue)}
        icon={DollarSign}
        variant="indigo"
      />
    </DnaKpiGrid>
  );
}
