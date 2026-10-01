import React from "react";
import { ArrowRightLeft, Clock, Boxes, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { TransferKpis } from "../_types/pindah-gudang.types";

interface TransferKpiCardsProps {
  kpis: TransferKpis;
}

export function TransferKpiCards({ kpis }: TransferKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Transfer Mutasi"
        value={`${kpis.totalTransfers} Dokumen`}
        icon={<ArrowRightLeft className="w-4 h-4 text-zinc-700" />}
      />
      <DnaStatCard
        label="Dalam Perjalanan (In Transit)"
        value={`${kpis.inTransitCount} Dokumen`}
        icon={<Clock className="w-4 h-4 text-zinc-700" />}
      />
      <DnaStatCard
        label="Total Unit Dipindahkan"
        value={`${kpis.totalVolume.toLocaleString("id-ID")} Unit`}
        icon={<Boxes className="w-4 h-4 text-zinc-700" />}
      />
      <DnaStatCard
        label="Selesai & Terverifikasi"
        value={`${kpis.verifiedCount} Transfer`}
        icon={<CheckCircle2 className="w-4 h-4 text-zinc-700" />}
      />
    </DnaKpiGrid>
  );
}

