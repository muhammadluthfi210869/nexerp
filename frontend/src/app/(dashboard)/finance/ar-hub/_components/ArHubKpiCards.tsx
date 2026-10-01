"use client";

import React from "react";
import { TrendingUp, CreditCard, Wallet, FlaskConical } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import type { ArHubKpis } from "../_types/ar-hub.types";

interface ArHubKpiCardsProps {
  kpis: ArHubKpis;
}

export function ArHubKpiCards({ kpis }: ArHubKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Receivables"
        value={kpis.isInvoicesLoading ? "â€¦" : formatRupiah(kpis.totalReceivables)}
        delta={{
          value: `${kpis.unpaidCount} Faktur Belum Lunas`,
          isPositive: true,
        }}
        icon={<TrendingUp className="text-blue-600" />}
        variant="blue"
      />
      <DnaStatCard
        label="Overdue (30+ Hari)"
        value={kpis.isInvoicesLoading ? "â€¦" : formatRupiah(kpis.overdue30)}
        delta={{ value: "Dihitung dari tanggal jatuh tempo", isPositive: false }}
        icon={<CreditCard className="text-rose-600" />}
        variant="rose"
      />
      <DnaStatCard
        label="Collections (MTD)"
        value={kpis.isInvoicesLoading ? "â€¦" : formatRupiah(kpis.collectionsMtd)}
        delta={{ value: "Faktur lunas bulan berjalan", isPositive: true }}
        icon={<Wallet className="text-emerald-500" />}
        variant="emerald"
      />
      <DnaStatCard
        label="Menunggu Validasi"
        value={kpis.isPendingLoading ? "â€¦" : `${kpis.pendingCount} Dokumen`}
        delta={{ value: `${formatRupiah(kpis.pendingAmount)} nilai tercatat`, isPositive: true }}
        icon={<FlaskConical className="text-amber-500" />}
        variant="amber"
      />
    </DnaKpiGrid>
  );
}
