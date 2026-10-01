import React from "react";
import { Package, Clock, CheckCircle2, Sparkles } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { SchedulePackagingKpis } from "../_types/schedule-packaging.types";

interface SchedulePackagingKpiCardsProps {
  kpis: SchedulePackagingKpis;
}

export const SchedulePackagingKpiCards: React.FC<SchedulePackagingKpiCardsProps> = ({ kpis }) => {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Jadwal Packaging"
        value={kpis.totalSchedules.toString()}
        icon={Package}
        variant="default"
        subtext="Batch terjadwal masuk packing line"
      />
      <DnaStatCard
        title="Menunggu Finishing"
        value={kpis.totalScheduled.toString()}
        icon={Clock}
        variant="warning"
        subtext="Inner box & master box siap"
      />
      <DnaStatCard
        title="Selesai Dikemas (BJD)"
        value={kpis.totalCompleted.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Tersimpan di gudang barang jadi"
      />
      <DnaStatCard
        title="Kepatuhan Segel & Barcode"
        value={kpis.complianceRate}
        icon={Sparkles}
        variant="info"
        subtext="Verifikasi nomor notifikasi BPOM"
      />
    </DnaKpiGrid>
  );
};
