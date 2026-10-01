"use client";

import React from "react";
import { FlaskConical, Clock, RotateCw, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { MixingKpis } from "../_types/mixing.types";

interface MixingKpiCardsProps {
  kpis: MixingKpis;
}

export function MixingKpiCards({ kpis }: MixingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL JADWAL MIXING"
        value={kpis.total.toString()}
        subValue="Akumulasi Batch Record"
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="SEDANG PROSES"
        value={kpis.proses.toString()}
        subValue="Bejana Sedang Aktif"
        icon={<Clock className="w-5 h-5 text-indigo-600" />}
      />
      <DnaStatCard
        label="TERTUNDA / PENDING"
        value={kpis.pending.toString()}
        subValue="Perlu Intervensi QC"
        icon={<RotateCw className="w-5 h-5 text-amber-600" />}
      />
      <DnaStatCard
        label="MIXING SELESAI"
        value={kpis.selesai.toString()}
        subValue="Siap Transfer ke Filling"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
