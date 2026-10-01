"use client";

import React from "react";
import { DollarSign, Clock, CheckCircle2, Package } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";
import { formatCurrency } from "@/lib/utils";

interface PrKpiCardsProps {
  totalBudget: number;
  totalRequests: number;
  pendingCount: number;
  approvedCount: number;
  orderedCount: number;
}

export function PrKpiCards({
  totalBudget,
  totalRequests,
  pendingCount,
  approvedCount,
  orderedCount,
}: PrKpiCardsProps) {
  return (
    <DnaKpiGrid
      items={[
        {
          label: "Total Nilai Pengajuan PR",
          value: formatCurrency(totalBudget),
          subtitle: "Akumulasi estimasi anggaran pengadaan",
          trend: `${totalRequests} Pengajuan`,
          icon: DollarSign,
          variant: "blue",
        },
        {
          label: "Menunggu Otorisasi Dana",
          value: `${pendingCount} PR Pending`,
          subtitle: "Verifikasi bertingkat 3-Tier",
          trend: "Antrean Aktif",
          icon: Clock,
          variant: "amber",
        },
        {
          label: "Disetujui (Siap Jadi PO)",
          value: `${approvedCount} PR Approved`,
          subtitle: "Siap diproses tim SCM Purchasing",
          trend: "Otorisasi Lengkap",
          icon: CheckCircle2,
          variant: "emerald",
        },
        {
          label: "Sudah Terbit PO Pembelian",
          value: `${orderedCount} PR Ordered`,
          subtitle: "Dalam proses pengiriman supplier",
          trend: "On Pipeline",
          icon: Package,
          variant: "purple",
        },
      ]}
    />
  );
}
