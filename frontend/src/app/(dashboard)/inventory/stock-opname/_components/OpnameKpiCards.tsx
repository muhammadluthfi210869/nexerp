"use client";

import React from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface OpnameKpiCardsProps {
  totalOpnames: number | string;
  totalCompleted: number | string;
  totalDraft: number | string;
  accuracy: string;
}

export function OpnameKpiCards({
  totalOpnames,
  totalCompleted,
  totalDraft,
  accuracy,
}: OpnameKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Sesi Opname"
        value={totalOpnames.toString()}
        icon={ClipboardCheck}
        variant="default"
        subtext="Akumulasi audit opname"
      />
      <DnaStatCard
        title="Opname Selesai & Disetujui"
        value={totalCompleted.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Saldo sistem tersinkron"
      />
      <DnaStatCard
        title="Opname Berjalan / Draft"
        value={totalDraft.toString()}
        icon={AlertTriangle}
        variant="warning"
        subtext="Menunggu rekonsiliasi akhir"
      />
      <DnaStatCard
        title="Tingkat Akurasi Stok"
        value={accuracy}
        icon={ShieldCheck}
        variant="info"
        subtext="Variance toleransi < 1%"
      />
    </DnaKpiGrid>
  );
}
