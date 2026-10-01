"use client";

import React from "react";
import { DollarSign, Package, Clock, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";
import type { ScmKpiMetrics } from "../_types/scm-pembelian.types";

interface ScmKpiCardsProps {
  kpis: ScmKpiMetrics;
}

export function ScmKpiCards({ kpis }: ScmKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Nilai PO Aktif"
        value={formatCurrency(kpis.totalPoValue)}
        icon={<DollarSign className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "Akumulasi belanja", isPositive: true }}
      />
      <DnaStatCard
        label="Total Order Pembelian"
        value={`${kpis.totalPoCount} PO`}
        icon={<Package className="w-5 h-5 text-slate-700" />}
      />
      <DnaStatCard
        label="Menunggu Inbound"
        value={`${kpis.pendingInboundCount} PO`}
        icon={<Clock className="w-5 h-5 text-amber-500" />}
        variant={kpis.pendingInboundCount > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Selesai Penerimaan"
        value={`${kpis.fullyReceivedCount} PO`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
