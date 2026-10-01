"use client";

import React from "react";
import { DollarSign, Clock, Wallet } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import type { FundRequestKpis } from "../_types/fund-requests.types";

interface FundRequestsKpiCardsProps {
  kpis: FundRequestKpis;
}

export function FundRequestsKpiCards({ kpis }: FundRequestsKpiCardsProps) {
  return (
    <DnaKpiGrid cols={3}>
      <DnaStatCard
        label="Total Pengajuan Bulan Ini"
        value={formatRupiah(kpis.totalPengajuanBulanIni)}
        icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        delta={{ value: `${kpis.totalCount} Pengajuan`, isPositive: true }}
        subtext="Total Permintaan Dana Masuk"
        variant="info"
      />
      <DnaStatCard
        label="Menunggu Approval"
        value={`${kpis.totalMenungguApproval} Permintaan`}
        icon={<Clock className="w-5 h-5 text-amber-600" />}
        delta={{ value: "Action Required", isPositive: false }}
        subtext="Perlu Verifikasi Manager/Accounting"
        variant="warning"
      />
      <DnaStatCard
        label="Sudah Dicairkan (Disbursed)"
        value={formatRupiah(kpis.totalDisbursed)}
        icon={<Wallet className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "Kas Keluar Posted", isPositive: true }}
        subtext="Dana Telah Diberikan ke Pemohon"
        variant="success"
      />
    </DnaKpiGrid>
  );
}
