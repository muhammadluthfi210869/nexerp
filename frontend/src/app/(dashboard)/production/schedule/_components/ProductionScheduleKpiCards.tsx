"use client";

import React from "react";
import { Calendar, FlaskConical, Zap, Package } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { ScheduleKpis } from "../_types/schedule.types";

interface ProductionScheduleKpiCardsProps {
  kpis: ScheduleKpis;
}

export function ProductionScheduleKpiCards({ kpis }: ProductionScheduleKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Jadwal Aktif"
        value={`${kpis.totalActive} Slot`}
        icon={<Calendar className="w-5 h-5 text-indigo-600" />}
        variant="default"
      />
      <DnaStatCard
        label="Lini Mixing"
        value={`${kpis.mixingCount} Jadwal`}
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Lini Filling"
        value={`${kpis.fillingCount} Jadwal`}
        icon={<Zap className="w-5 h-5 text-purple-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Lini Packaging"
        value={`${kpis.packingCount} Jadwal`}
        icon={<Package className="w-5 h-5 text-amber-600" />}
        variant="warning"
      />
    </DnaKpiGrid>
  );
}
