import React from "react";
import { FileText, Lock, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import type { OpnameKpis } from "../_types/opname.types";

interface WarehouseOpnameKpiCardsProps {
  kpis: OpnameKpis;
}

export function WarehouseOpnameKpiCards({ kpis }: WarehouseOpnameKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Sesi Opname"
        value={`${kpis.total} Sesi`}
        icon={<FileText className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "+1 bulan ini", isPositive: true }}
        variant="info"
      />
      <DnaStatCard
        label="Sesi Berjalan (Frozen)"
        value={`${kpis.active} Sesi`}
        icon={<Lock className="w-5 h-5 text-amber-500" />}
        variant={kpis.active > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Selesai Rekonsiliasi"
        value={`${kpis.closed} Sesi`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Net Varians Akumulasi"
        value={formatRupiah(kpis.netVariance)}
        icon={kpis.netVariance < 0 ? <TrendingDown className="w-5 h-5 text-red-500" /> : <TrendingUp className="w-5 h-5 text-emerald-600" />}
        subtext="Selisih Fisik vs Sistem"
        variant={kpis.netVariance < 0 ? "warning" : "success"}
      />
    </DnaKpiGrid>
  );
}
