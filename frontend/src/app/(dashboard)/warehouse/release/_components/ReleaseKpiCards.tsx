import React from "react";
import { Truck, Package, Layers, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { ReleaseKpis } from "../_types/release.types";

interface ReleaseKpiCardsProps {
  kpis: ReleaseKpis;
}

export function ReleaseKpiCards({ kpis }: ReleaseKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Surat Jalan (SJ)"
        value={`${kpis.totalDeliveries} Pengiriman`}
        icon={<Truck className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Total Unit Dikirim (Pcs)"
        value={`${kpis.totalUnitsShipped.toLocaleString("id-ID")} Pcs`}
        icon={<Package className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Total Box Karton"
        value={`${kpis.totalBoxes.toLocaleString("id-ID")} Box`}
        icon={<Layers className="w-5 h-5 text-purple-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Financial Gate On Hold"
        value={`${kpis.onHoldCount} Dokumen`}
        icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        variant={kpis.onHoldCount > 0 ? "warning" : "default"}
      />
    </DnaKpiGrid>
  );
}
