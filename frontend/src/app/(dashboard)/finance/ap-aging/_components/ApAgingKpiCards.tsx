import React from "react";
import { DollarSign, AlertTriangle, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import type { ApAgingKpis } from "../_types/ap-aging.types";

interface ApAgingKpiCardsProps {
  kpis: ApAgingKpis;
}

export function ApAgingKpiCards({ kpis }: ApAgingKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Outstanding AP"
        value={formatRupiah(kpis.totalOutstanding)}
        icon={<DollarSign className="w-5 h-5 text-rose-600" />}
        delta={{ value: `${kpis.totalInvoices} Faktur Supplier`, isPositive: false }}
        subtext="Total Kewajiban Hutang Berjalan"
        variant="critical"
      />
      <DnaStatCard
        label="Jatuh Tempo H-3 (Mendesak)"
        value={`${kpis.countH3} Tagihan (Merah)`}
        icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
        delta={{ value: "Deadline < 3 Hari", isPositive: false }}
        subtext="Segera Jadwalkan Kas Keluar"
        variant="critical"
      />
      <DnaStatCard
        label="Jatuh Tempo H-7 (Peringatan)"
        value={`${kpis.countH7} Tagihan (Kuning)`}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        delta={{ value: "Deadline < 7 Hari", isPositive: true }}
        subtext="Siapkan Likuiditas Bank"
        variant="warning"
      />
      <DnaStatCard
        label="Overdue (Lewat Jatuh Tempo)"
        value={`${kpis.overdueCount} Tagihan`}
        icon={<AlertTriangle className="w-5 h-5 text-rose-700" />}
        delta={{ value: "Tertunggak", isPositive: false }}
        subtext="Risiko Hold Pengiriman Bahan"
        variant="critical"
      />
    </DnaKpiGrid>
  );
}
