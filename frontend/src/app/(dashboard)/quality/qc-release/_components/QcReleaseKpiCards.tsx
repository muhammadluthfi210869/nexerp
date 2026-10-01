import React from "react";
import { Clock, ShieldCheck, FlaskConical, Sparkles } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface QcReleaseKpiCardsProps {
  quarantineCount: number;
  releasedCount: number;
  investigationCount: number;
}

export function QcReleaseKpiCards({
  quarantineCount,
  releasedCount,
  investigationCount,
}: QcReleaseKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="MENUNGGU RILIS APJ"
        value={`${quarantineCount} Batch`}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        subValue="Karantina Kepatuhan CPKB"
      />
      <DnaStatCard
        label="BATCH LOLOS RILIS"
        value={`${releasedCount} Batch`}
        icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        subValue="Tersimpan di WH-03"
      />
      <DnaStatCard
        label="INKUBASI MIKROBIOLOGI"
        value={`${investigationCount} Batch`}
        icon={<FlaskConical className="w-5 h-5 text-blue-600" />}
        subValue="Uji Inkubasi 72 Jam"
      />
      <DnaStatCard
        label="SLA RATA-RATA RILIS"
        value="3.2 Jam"
        icon={<Sparkles className="w-5 h-5 text-purple-600" />}
        subValue="Target Standar < 6 Jam"
      />
    </DnaKpiGrid>
  );
}
