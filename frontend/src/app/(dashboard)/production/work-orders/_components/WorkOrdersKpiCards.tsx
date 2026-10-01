"use client";

import React from "react";
import { Factory, FlaskConical, Package, ShieldAlert } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { WorkOrdersKpis } from "../_types/work-orders.types";

interface WorkOrdersKpiCardsProps {
  kpis: WorkOrdersKpis;
}

export function WorkOrdersKpiCards({ kpis }: WorkOrdersKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL SPK AKTIF"
        value={`${kpis.totalActive} Batch`}
        icon={<Factory className="w-5 h-5 text-blue-600" />}
        subValue="Dalam Lini Produksi"
      />
      <DnaStatCard
        label="MIXING (RUAHAN)"
        value={`${kpis.inMixing} Batch`}
        icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
        subValue="Tahap 1 (Bulk Mixing)"
      />
      <DnaStatCard
        label="FILLING & PACKAGING"
        value={`${kpis.inFilling + kpis.inPacking} Batch`}
        icon={<Package className="w-5 h-5 text-amber-600" />}
        subValue="Tahap 2 & 3"
      />
      <DnaStatCard
        label="KARANTINA QC / APJ"
        value={`${kpis.qcHoldCount} Batch`}
        icon={<ShieldAlert className="w-5 h-5 text-rose-600" />}
        subValue="Menunggu Rilis Mutu"
      />
    </DnaKpiGrid>
  );
}
