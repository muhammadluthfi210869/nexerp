import React from "react";
import { Truck, CheckCircle2, AlertTriangle, Gift } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { InboundKpis } from "../_types/inbound.types";

interface InboundKpiCardsProps {
  kpis: InboundKpis;
}

export function InboundKpiCards({ kpis }: InboundKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Dokumen GRN"
        value={`${kpis.totalGrn} Dokumen`}
        icon={<Truck className="w-5 h-5 text-indigo-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Total Qty Real Stok (Bagus)"
        value={`${kpis.totalGood.toLocaleString("id-ID")} Qty`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Total Qty Reject (Klaim)"
        value={`${kpis.totalReject.toLocaleString("id-ID")} Qty`}
        icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
        variant={kpis.totalReject > 0 ? "critical" : "default"}
      />
      <DnaStatCard
        label="Total Qty Free / Bonus (HPP Rp 0)"
        value={`${(kpis.totalFree ?? 0).toLocaleString("id-ID")} Qty`}
        icon={<Gift className="w-5 h-5 text-purple-600" />}
        variant="purple"
      />
    </DnaKpiGrid>
  );
}
