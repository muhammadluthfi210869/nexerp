import React from "react";
import { ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import { CashOutDateRange } from "../_types/cash-out.types";

interface CashOutKpiCardsProps {
  totalKasKeluar: number;
  totalReconciled?: number;
  totalUnreconciled?: number;
  dateRange?: CashOutDateRange;
}

export const CashOutKpiCards: React.FC<CashOutKpiCardsProps> = ({
  totalKasKeluar,
  totalReconciled = 0,
  totalUnreconciled = 0,
  dateRange,
}) => {
  return (
    <DnaKpiGrid cols={1}>
      <DnaStatCard
        label="Total Kas Keluar Periode"
        value={formatRupiah(totalKasKeluar)}
        icon={<ArrowUpRight className="w-5 h-5 text-rose-600" />}
        delta={{ value: "Pengeluaran Disetujui", isPositive: false }}
        subtext={dateRange?.start ? `Periode ${dateRange.start} s/d ${dateRange.end}` : "Semua mutasi pengeluaran"}
        variant="critical"
      />
    </DnaKpiGrid>
  );
};
