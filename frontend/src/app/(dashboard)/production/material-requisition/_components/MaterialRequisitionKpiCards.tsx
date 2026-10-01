"use client";

import React from "react";
import { Clock, PackageCheck, Layers, AlertTriangle } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { MaterialRequisitionKpis } from "../_types/material-requisition.types";

interface MaterialRequisitionKpiCardsProps {
  kpis: MaterialRequisitionKpis;
}

export function MaterialRequisitionKpiCards({ kpis }: MaterialRequisitionKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Menunggu Pengeluaran"
        value={`${kpis.totalSubmitted} Permintaan`}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        variant="warning"
      />
      <DnaStatCard
        label="Sebagian Dikeluarkan"
        value={`${kpis.partiallyIssued} Permintaan`}
        icon={<Layers className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Telah Dikeluarkan (Selesai)"
        value={`${kpis.totalIssued} Permintaan`}
        icon={<PackageCheck className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Draft Permintaan"
        value={`${kpis.shortageCount} Dokumen`}
        icon={<AlertTriangle className="w-5 h-5 text-slate-600" />}
        variant="default"
      />
    </DnaKpiGrid>
  );
}
