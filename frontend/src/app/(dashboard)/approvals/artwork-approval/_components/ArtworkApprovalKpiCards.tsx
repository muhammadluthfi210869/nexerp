import React from "react";
import { DnaKpiGrid, KpiCard } from "@/components/dna";

interface ArtworkApprovalKpiCardsProps {
  counts: {
    total: number;
    waitingApj: number;
    waitingClient: number;
    final: number;
  };
}

export function ArtworkApprovalKpiCards({ counts }: ArtworkApprovalKpiCardsProps) {
  return (
    <DnaKpiGrid>
      <KpiCard label="Total Task Desain" value={counts.total} subtext="Seluruh task aktif di creative" variant="slate" />
      <KpiCard label="Menunggu Review APJ" value={counts.waitingApj} subtext="Antrean validasi Legal/APJ" variant="amber" />
      <KpiCard label="Menunggu ACC Klien" value={counts.waitingClient} subtext="Sudah lolos APJ, menunggu klien" variant="slate" />
      <KpiCard label="Final / Terkunci" value={counts.final} subtext="Artwork sudah di-ACC dan dikunci" variant="emerald" />
    </DnaKpiGrid>
  );
}
