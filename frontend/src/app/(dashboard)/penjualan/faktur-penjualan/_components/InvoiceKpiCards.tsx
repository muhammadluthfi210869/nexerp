"use client";

import React from "react";
import { DollarSign, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface InvoiceKpiCardsProps {
  totalInvoiced: number;
  totalPaid: number;
  totalUnpaid: number;
  heldCount: number;
  countAll: number;
  countPaid: number;
  countUnpaid: number;
}

export function InvoiceKpiCards({
  totalInvoiced,
  totalPaid,
  totalUnpaid,
  heldCount,
  countAll,
  countPaid,
  countUnpaid,
}: InvoiceKpiCardsProps) {
  return (
    <DnaKpiGrid
      items={[
        {
          label: "Total Piutang Tertagih (Grand Total)",
          value: `Rp ${(totalInvoiced / 1000000).toFixed(1)} Jt`,
          subtitle: `${countAll} faktur penjualan aktif`,
          trend: "+15% bln ini",
          icon: DollarSign,
          variant: "blue",
        },
        {
          label: "Kas Masuk / Terbayar",
          value: `Rp ${(totalPaid / 1000000).toFixed(1)} Jt`,
          subtitle: `${countPaid} tagihan lunas`,
          trend: "Realized AR",
          icon: CheckCircle2,
          variant: "emerald",
        },
        {
          label: "Sisa Piutang Berjalan (Outstanding)",
          value: `Rp ${(totalUnpaid / 1000000).toFixed(1)} Jt`,
          subtitle: `${countUnpaid} menunggu pelunasan`,
          trend: "Butuh follow-up",
          icon: Clock,
          variant: "amber",
        },
        {
          label: "Delivery Order Ditahan (AR Gatekeeper)",
          value: `${heldCount} Pengiriman`,
          subtitle: "Terkunci sebelum lunas / syarat DP",
          trend: "Perlindungan aset",
          icon: ShieldAlert,
          variant: heldCount > 0 ? "critical" : "purple",
        },
      ]}
    />
  );
}
