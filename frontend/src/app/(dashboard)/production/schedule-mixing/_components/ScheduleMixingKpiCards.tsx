"use client";

import React from "react";
import { FlaskConical, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { ScheduleMixingKpiData } from "../_types/schedule-mixing.types";

interface ScheduleMixingKpiCardsProps {
  kpis: ScheduleMixingKpiData;
}

export function ScheduleMixingKpiCards({ kpis }: ScheduleMixingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Jadwal Mixing"
        value={kpis.totalSchedules.toString()}
        icon={FlaskConical}
        variant="default"
        subtext="Akumulasi batch terjadwal"
      />
      <DnaStatCard
        title="Menunggu Eksekusi"
        value={kpis.totalScheduled.toString()}
        icon={Clock}
        variant="warning"
        subtext="Siap masuk bejana mixing"
      />
      <DnaStatCard
        title="Batch Selesai"
        value={kpis.totalCompleted.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Lolos uji homogenitas QC"
      />
      <DnaStatCard
        title="Toleransi Upscale"
        value="5% - 10%"
        icon={TrendingUp}
        variant="info"
        subtext="Kompensasi dead volume mesin"
      />
    </DnaKpiGrid>
  );
}
