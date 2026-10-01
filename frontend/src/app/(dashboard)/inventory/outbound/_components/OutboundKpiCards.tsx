import React from "react";
import { Truck, CheckCircle2, Send, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface OutboundKpiCardsProps {
  totalDeliveries: number;
  totalDelivered: number;
  totalShipped: number;
  totalPacking: number;
}

export function OutboundKpiCards({
  totalDeliveries,
  totalDelivered,
  totalShipped,
  totalPacking,
}: OutboundKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        title="Total Surat Jalan"
        value={totalDeliveries.toString()}
        icon={Truck}
        variant="default"
        subtext="Total delivery order terbit"
      />
      <DnaStatCard
        title="Terkirim & Diterima"
        value={totalDelivered.toString()}
        icon={CheckCircle2}
        variant="success"
        subtext="Lolos konfirmasi penerimaan"
      />
      <DnaStatCard
        title="Dalam Pengiriman"
        value={totalShipped.toString()}
        icon={Send}
        variant="info"
        subtext="Dalam perjalanan ekspedisi"
      />
      <DnaStatCard
        title="Antrean Packing"
        value={totalPacking.toString()}
        icon={Clock}
        variant="warning"
        subtext="Proses seal & wrapping gudang"
      />
    </DnaKpiGrid>
  );
}
