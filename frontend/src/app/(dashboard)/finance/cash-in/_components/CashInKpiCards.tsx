import React from "react";
import { ArrowDownLeft, CheckCircle2, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import { CashInDateRange } from "../_types/cash-in.types";

interface CashInKpiCardsProps {
  totalKasMasuk: number;
  totalReconciled?: number;
  totalUnreconciled?: number;
  dateRange?: CashInDateRange;
}

export const CashInKpiCards: React.FC<CashInKpiCardsProps> = ({
  totalKasMasuk,
  totalReconciled = 0,
  totalUnreconciled = 0,
  dateRange,
}) => {
  return (
    <DnaKpiGrid cols={1}>
      <DnaStatCard
        label="Total Kas Masuk Periode"
        value={formatRupiah(totalKasMasuk)}
        icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "Inflow Terverifikasi", isPositive: true }}
        subtext={dateRange ? `Periode ${dateRange.start} s/d ${dateRange.end}` : "Semua Periode Transaksi"}
        variant="success"
      />
    </DnaKpiGrid>
  );
};
