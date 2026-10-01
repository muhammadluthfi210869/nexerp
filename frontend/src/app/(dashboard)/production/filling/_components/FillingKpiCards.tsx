import React from "react";
import { Package, Clock, RotateCw, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { FillingKpis } from "../_types/filling.types";

interface FillingKpiCardsProps {
  kpis: FillingKpis;
}

export function FillingKpiCards({ kpis }: FillingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL JADWAL FILLING"
        value={kpis.total.toString()}
        subValue="Akumulasi Batch Primer"
        icon={<Package className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="SEDANG PROSES"
        value={kpis.proses.toString()}
        subValue="Line Sedang Berjalan"
        icon={<Clock className="w-5 h-5 text-purple-600" />}
      />
      <DnaStatCard
        label="TERTUNDA / PENDING"
        value={kpis.pending.toString()}
        subValue="Perlu Penyesuaian Nozzle"
        icon={<RotateCw className="w-5 h-5 text-amber-600" />}
      />
      <DnaStatCard
        label="FILLING SELESAI"
        value={kpis.selesai.toString()}
        subValue="Siap Masuk Packaging"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
