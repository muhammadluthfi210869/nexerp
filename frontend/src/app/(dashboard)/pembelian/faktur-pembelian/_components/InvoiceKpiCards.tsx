"use client";

import React from "react";
import { FileText, DollarSign, AlertCircle, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import { InvoiceKpis } from "../_types/faktur-pembelian.types";

interface InvoiceKpiCardsProps {
  kpis: InvoiceKpis;
}

export function InvoiceKpiCards({ kpis }: InvoiceKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Tagihan Masuk"
        value={`${kpis.totalCount} Faktur`}
        icon={<FileText className="w-5 h-5 text-indigo-600" />}
        delta={{ value: "+5 bulan ini", isPositive: true }}
      />
      <DnaStatCard
        label="Total Nilai Faktur"
        value={`Rp ${kpis.totalGrand.toLocaleString("id-ID")}`}
        icon={<DollarSign className="w-5 h-5 text-slate-700" />}
      />
      <DnaStatCard
        label="Hutang Belum Lunas"
        value={`Rp ${kpis.totalUnpaid.toLocaleString("id-ID")}`}
        icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
        variant={kpis.totalUnpaid > 0 ? "warning" : "default"}
      />
      <DnaStatCard
        label="Faktur Lunas"
        value={`${kpis.paidCount} Faktur`}
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
