"use client";

import React from "react";
import { Palette, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { DesignKpiStats } from "../_types/design.types";

interface DesignKpiCardsProps {
  stats: DesignKpiStats;
}

export function DesignKpiCards({ stats }: DesignKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL TASK DESAIN"
        value={`${stats.totalBerjalan} Task`}
        subValue="Seluruh task pada papan Creative"
        icon={<Palette className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="MENUNGGU PERSETUJUAN"
        value={`${stats.menungguApproval} Task`}
        subValue="Status WAITING_APJ & WAITING_CLIENT"
        icon={<Clock className="w-5 h-5 text-amber-600" />}
      />
      <DnaStatCard
        label="DESAIN FINAL / LOCKED"
        value={`${stats.disetujui} Siap Cetak`}
        subValue="Approved oleh klien (isFinal / isLocked)"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="PERNAH DIREVISI"
        value={`${stats.perluRevisi} Task`}
        subValue="revisionCount > 0 atau status REVISION"
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
      />
    </DnaKpiGrid>
  );
}
