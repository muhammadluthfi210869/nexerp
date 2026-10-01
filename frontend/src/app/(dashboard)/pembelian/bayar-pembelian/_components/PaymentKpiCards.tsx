"use client";

import React from "react";
import { DollarSign, AlertTriangle, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { PaymentKpiData } from "../_types/bayar-pembelian.types";

interface PaymentKpiCardsProps {
  kpis: PaymentKpiData;
}

export function PaymentKpiCards({ kpis }: PaymentKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Hutang Dagang (AP)"
        value={`Rp ${kpis.totalUnpaid.toLocaleString("id-ID")}`}
        subtext="Seluruh tagihan belum lunas"
        icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
        variant="primary"
      />
      <DnaStatCard
        label="Tagihan Overdue (Lewat Tempo)"
        value={`${kpis.overdueCount} Faktur`}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        variant={kpis.overdueCount > 0 ? "critical" : "default"}
        delta={{ value: `Rp ${kpis.overdueAmount.toLocaleString("id-ID")}`, isPositive: false }}
      />
      <DnaStatCard
        label="Jatuh Tempo H-3 (Kritis)"
        value={`${kpis.dueH3Count} Faktur`}
        subtext="Perlu pelunasan segera"
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        variant={kpis.dueH3Count > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Jatuh Tempo H-7 (Siaga)"
        value={`${kpis.dueH7Count} Faktur`}
        subtext="Monitoring kas keluar"
        icon={<Clock className="w-5 h-5 text-blue-500" />}
        variant="info"
      />
    </DnaKpiGrid>
  );
}
