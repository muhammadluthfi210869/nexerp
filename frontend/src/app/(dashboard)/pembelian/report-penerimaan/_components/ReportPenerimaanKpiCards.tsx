"use client";

import React from "react";
import { PackageCheck, CheckCircle2, AlertOctagon, Gift } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";
import type { ReceivingReportKpis } from "../_types/report-penerimaan.types";

interface ReportPenerimaanKpiCardsProps {
  kpis: ReceivingReportKpis;
}

export function ReportPenerimaanKpiCards({ kpis }: ReportPenerimaanKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Barang Diterima"
        value={`${kpis.totalQtyReceived.toLocaleString("id-ID")}`}
        subtext={`${kpis.totalReceivedItems} Baris Item Diterima`}
        icon={<PackageCheck className="w-5 h-5 text-blue-600" />}
        variant="primary"
      />
      <DnaStatCard
        label="Jumlah Kondisi Bagus"
        value={`${kpis.totalQtyGood.toLocaleString("id-ID")}`}
        subtext="Masuk Real Stok & Siap Bayar"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Jumlah Cacat / Reject"
        value={`${kpis.totalQtyReject.toLocaleString("id-ID")}`}
        subtext="Tidak Dibayar / Retur Supplier"
        icon={<AlertOctagon className="w-5 h-5 text-rose-600" />}
        variant={kpis.totalQtyReject > 0 ? "critical" : "default"}
      />
      <DnaStatCard
        label="Jumlah Barang Gratis (Free)"
        value={`${kpis.totalQtyFree.toLocaleString("id-ID")}`}
        subtext="Bonus Supplier (HPP Rp 0)"
        icon={<Gift className="w-5 h-5 text-purple-600" />}
        variant="info"
      />
    </DnaKpiGrid>
  );
}
