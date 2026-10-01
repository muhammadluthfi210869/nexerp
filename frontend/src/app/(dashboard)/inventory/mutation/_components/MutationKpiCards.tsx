import React from "react";
import { ArrowRightLeft, CheckCircle2, Clock, Warehouse } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface MutationKpiCardsProps {
  totalTransfers: number;
  totalCompleted: number;
  totalPending: number;
}

export function MutationKpiCards({
  totalTransfers,
  totalCompleted,
  totalPending,
}: MutationKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Dokumen Transfer"
        value={totalTransfers.toString()}
        icon={ArrowRightLeft}
        variant="default"
        subtext="Akumulasi surat jalan mutasi"
      />
      <DnaStatCard
        title="Mutasi Selesai (In-Place)"
        value={totalCompleted.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Fisik sudah masuk stok tujuan"
      />
      <DnaStatCard
        title="Dalam Proses / Transit"
        value={totalPending.toString()}
        icon={Clock}
        variant="warning"
        subtext="Menunggu verifikasi penerimaan"
      />
      <DnaStatCard
        title="Gudang Terintegrasi"
        value="5 Lokasi"
        icon={Warehouse}
        variant="info"
        subtext="Bahan Baku, Kemasan, Jadi, dsb"
      />
    </DnaKpiGrid>
  );
}
