import React from "react";
import { Boxes, Clock, RotateCw, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { PackagingKpiStats } from "../_types/packaging.types";

interface PackagingKpiCardsProps {
  kpis: PackagingKpiStats;
}

export function PackagingKpiCards({ kpis }: PackagingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL JADWAL PACKAGING"
        value={kpis.total.toString()}
        subValue="Akumulasi Lini Sekunder"
        icon={<Boxes className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="SEDANG PROSES"
        value={kpis.proses.toString()}
        subValue="Conveyor Line Aktif"
        icon={<Clock className="w-5 h-5 text-amber-600" />}
      />
      <DnaStatCard
        label="TERTUNDA / PENDING"
        value={kpis.pending.toString()}
        subValue="Menunggu Material Sekunder"
        icon={<RotateCw className="w-5 h-5 text-orange-600" />}
      />
      <DnaStatCard
        label="PACKAGING SELESAI"
        value={kpis.selesai.toString()}
        subValue="Siap Masuk Karantina QC APJ"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
