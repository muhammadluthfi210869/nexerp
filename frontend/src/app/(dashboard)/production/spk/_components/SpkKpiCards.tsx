"use client";

import React from "react";
import { FileText, PlayCircle, Clock, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { SpkKpis } from "../_types/spk.types";

interface SpkKpiCardsProps {
  kpis: SpkKpis;
}

export function SpkKpiCards({ kpis }: SpkKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total SPK Terbit"
        value={`${kpis.totalSpk} SPK`}
        icon={<FileText className="w-5 h-5 text-zinc-900" />}
        variant="default"
      />
      <DnaStatCard
        label="SPK Dalam Produksi"
        value={`${kpis.inProgressCount} SPK`}
        icon={<PlayCircle className="w-5 h-5 text-zinc-900" />}
        variant="warning"
      />
      <DnaStatCard
        label="SPK Menunggu Rilis"
        value={`${kpis.pendingReleaseCount} SPK`}
        icon={<Clock className="w-5 h-5 text-zinc-900" />}
        variant="info"
      />
      <DnaStatCard
        label="SPK Selesai"
        value={`${kpis.completedCount} SPK`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
    </DnaKpiGrid>
  );
}
