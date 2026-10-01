import React from "react";
import { ArrowDownLeft, CheckCircle2, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import { CashInDateRange } from "../_types/cash-in.types";

interface CashInKpiCardsProps {
  totalKasMasuk: number;
  totalReconciled?: number;
  totalUnreconciled?: number;
  dateRange: CashInDateRange;
}

export const CashInKpiCards: React.FC<CashInKpiCardsProps> = ({
  totalKasMasuk,
  totalReconciled = 0,
  totalUnreconciled = 0,
  dateRange,
}) => {
  return (
    <DnaKpiGrid cols={3}>
      <DnaStatCard
        label="Total Kas Masuk Periode"
        value={formatRupiah(totalKasMasuk)}
        icon={<ArrowDownLeft className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "Inflow Terverifikasi", isPositive: true }}
        subtext={`Periode ${dateRange.start} s/d ${dateRange.end}`}
        variant="success"
      />
      <DnaStatCard
        label="Kas Masuk Terekonsiliasi"
        value={`${totalReconciled} Transaksi`}
        icon={<CheckCircle2 className="w-5 h-5 text-blue-600" />}
        delta={{ value: "Cocok Rek Koran", isPositive: true }}
        subtext="Sudah match mutasi bank"
        variant="info"
      />
      <DnaStatCard
        label="Belum Rekonsiliasi"
        value={`${totalUnreconciled} Transaksi`}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        delta={{ value: "Perlu Penelaahan", isPositive: false }}
        subtext="Menunggu verifikasi bank"
        variant="warning"
      />
    </DnaKpiGrid>
  );
};
