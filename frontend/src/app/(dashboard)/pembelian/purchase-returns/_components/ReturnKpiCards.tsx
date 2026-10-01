import React from "react";
import { RotateCcw, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { PurchaseReturnKpis } from "../_types/purchase-returns.types";

interface ReturnKpiCardsProps {
  kpis: PurchaseReturnKpis;
}

export function ReturnKpiCards({ kpis }: ReturnKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Klaim Retur"
        value={`${kpis.total} Kasus`}
        icon={<RotateCcw className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "+2 minggu ini", isPositive: true }}
      />
      <DnaStatCard
        label="Nilai Klaim Aktif"
        value={`Rp ${kpis.totalValue.toLocaleString("id-ID")}`}
        icon={<DollarSign className="w-5 h-5 text-purple-600" />}
      />
      <DnaStatCard
        label="Menunggu Vendor"
        value={`${kpis.pending} Dokumen`}
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        variant={kpis.pending > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Selesai / Terkompensasi"
        value={`${kpis.approved} Dokumen`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
