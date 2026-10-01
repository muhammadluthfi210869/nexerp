import React from "react";
import { Truck, FileSearch, ShieldCheck, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface ReceivingKpiCardsProps {
  arrivalsToday: number;
  awaitingQc: number;
  verifiedMtd: number;
  rejected: number;
}

export function ReceivingKpiCards({
  arrivalsToday,
  awaitingQc,
  verifiedMtd,
  rejected,
}: ReceivingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Kedatangan Hari Ini"
        value={`${arrivalsToday} GRN`}
        icon={<Truck className="w-5 h-5 text-indigo-600" />}
      />
      <DnaStatCard
        label="Menunggu Verifikasi QC"
        value={`${awaitingQc} GRN`}
        icon={<FileSearch className="w-5 h-5 text-amber-500" />}
        variant={awaitingQc > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Terverifikasi (MTD)"
        value={`${verifiedMtd} GRN`}
        icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="Ditolak / Gagal QC"
        value={`${rejected} GRN`}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        variant={rejected > 0 ? "critical" : "default"}
      />
    </DnaKpiGrid>
  );
}
