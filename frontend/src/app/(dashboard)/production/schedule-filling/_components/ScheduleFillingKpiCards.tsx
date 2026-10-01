"use client";

import React from "react";
import { Pipette, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { ScheduleFillingKpis } from "../_types/schedule-filling.types";

interface ScheduleFillingKpiCardsProps {
  kpis: ScheduleFillingKpis;
}

export function ScheduleFillingKpiCards({ kpis }: ScheduleFillingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Jadwal Filling"
        value={kpis.totalSchedules.toString()}
        icon={Pipette}
        variant="default"
        subtext="Batch terjadwal masuk lini filling"
      />
      <DnaStatCard
        title="Menunggu Pengisian"
        value={kpis.totalScheduled.toString()}
        icon={Clock}
        variant="warning"
        subtext="Kemasan primer siap di conveyor"
      />
      <DnaStatCard
        title="Selesai Diisi"
        value={kpis.totalCompleted.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Siap lanjut ke lini packaging"
      />
      <DnaStatCard
        title="Presisi Nozzle Mesin"
        value={kpis.nozzlePrecision}
        icon={Sparkles}
        variant="info"
        subtext="Toleransi volume isi standar BPOM"
      />
    </DnaKpiGrid>
  );
}
