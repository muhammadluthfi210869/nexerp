"use client";

import React from "react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { FlaskConical, Clock, CheckCircle2, ShieldCheck } from "lucide-react";

interface RndProjectMonitoringKpiCardsProps {
  totalCount: number;
  stabilityCount: number;
  readyCount: number;
}

export function RndProjectMonitoringKpiCards({
  totalCount,
  stabilityCount,
  readyCount,
}: RndProjectMonitoringKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Proyek R&D Aktif"
        value={`${totalCount} Proyek`}
        variant="blue"
        icon={<FlaskConical className="h-4 w-4" />}
        delta={{ value: "Lab Queue & Active", isPositive: true }}
      />
      <DnaStatCard
        label="Dalam Uji Stabilitas Lab"
        value={`${stabilityCount} Batch Uji`}
        variant="amber"
        icon={<Clock className="h-4 w-4" />}
        delta={{ value: "Oven 45Â°C & RT Chamber", isPositive: true }}
      />
      <DnaStatCard
        label="Siap Produksi / NIE Terbit"
        value={`${readyCount} Formula`}
        variant="emerald"
        icon={<CheckCircle2 className="h-4 w-4" />}
        delta={{ value: "Formula Valid CPKB", isPositive: true }}
      />
      <DnaStatCard
        label="Tingkat Lolos Uji Stabilitas"
        value="92.4%"
        variant="indigo"
        icon={<ShieldCheck className="h-4 w-4" />}
        delta={{ value: "Target Mutu > 90%", isPositive: true }}
      />
    </DnaKpiGrid>
  );
}
