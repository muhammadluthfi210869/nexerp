import React from "react";
import { Wallet, CheckCircle2, Clock, Percent } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface PaymentKpiCardsProps {
  totalReceivables: number;
  totalNetCash: number;
  totalRemaining: number;
  totalPph23: number;
  totalPph21: number;
}

export function PaymentKpiCards({
  totalReceivables,
  totalNetCash,
  totalRemaining,
  totalPph23,
  totalPph21,
}: PaymentKpiCardsProps) {
  return (
    <DnaKpiGrid
      items={[
        {
          label: "Total Piutang Faktur",
          value: `Rp ${(totalReceivables / 1000000).toFixed(1)} Jt`,
          subtitle: "Total tagihan komersial",
          trend: "+12% bln ini",
          icon: Wallet,
          variant: "blue",
        },
        {
          label: "Kas Bersih Diterima (Bank)",
          value: `Rp ${(totalNetCash / 1000000).toFixed(1)} Jt`,
          subtitle: "Total net masuk kas/bank",
          trend: "Realized Cash",
          icon: CheckCircle2,
          variant: "emerald",
        },
        {
          label: "Sisa Piutang (Outstanding)",
          value: `Rp ${(totalRemaining / 1000000).toFixed(1)} Jt`,
          subtitle: "Menunggu pembayaran klien",
          trend: "Piutang aktif",
          icon: Clock,
          variant: "amber",
        },
        {
          label: "Rekap Potongan PPh 21 / 23",
          value: `Rp ${((totalPph23 + totalPph21) / 1000000).toFixed(2)} Jt`,
          subtitle: `PPh 23: Rp ${(totalPph23 / 1000).toFixed(0)}rb | PPh 21: Rp ${(totalPph21 / 1000).toFixed(0)}rb`,
          trend: "Bukti potong terverifikasi",
          icon: Percent,
          variant: "purple",
        },
      ]}
    />
  );
}
