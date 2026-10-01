import React from "react";
import { Lock, CheckCircle2, FlaskConical, Archive } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { RepositoryKpiStats } from "../_types/repository.types";

interface RepositoryKpiCardsProps {
  stats: RepositoryKpiStats;
}

export function RepositoryKpiCards({ stats }: RepositoryKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Formula Terenkripsi"
        value={`${stats.totalFormulas} Formula`}
        icon={<Lock className="w-5 h-5 text-indigo-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Formula Lolos Rilis CPKB"
        value={`${stats.releasedCount} Formula`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Uji Stabilitas Lolos"
        value={`${stats.stableCount} Formula`}
        icon={<FlaskConical className="w-5 h-5 text-purple-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Arsip Formula Non-Aktif"
        value={`${stats.archivedCount} Formula`}
        icon={<Archive className="w-5 h-5 text-amber-600" />}
        variant="warning"
      />
    </DnaKpiGrid>
  );
}
