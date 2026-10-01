import React from "react";
import { Receipt, DollarSign, Wallet, Clock } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { DpPembelianKpis } from "../_types/dp-pembelian.types";

interface DpKpiCardsProps {
  kpis: DpPembelianKpis;
}

export function DpKpiCards({ kpis }: DpKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Pembayaran DP"
        value={`${kpis.total} Transaksi`}
        icon={<Receipt className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "+4 bulan ini", isPositive: true }}
      />
      <DnaStatCard
        label="Total Nilai DP Terbayar"
        value={`Rp ${kpis.totalPaid.toLocaleString("id-ID")}`}
        icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
      />
      <DnaStatCard
        label="DP Belum Dipotong Faktur"
        value={`Rp ${kpis.unallocated.toLocaleString("id-ID")}`}
        icon={<Wallet className="w-5 h-5 text-purple-600" />}
      />
      <DnaStatCard
        label="Menunggu Approval"
        value={`${kpis.pending} Dokumen`}
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        variant={kpis.pending > 0 ? "warning" : "default"}
      />
    </DnaKpiGrid>
  );
}
