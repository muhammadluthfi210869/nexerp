import React from "react";
import { Wallet, CheckCircle2, Clock, FileCheck2 } from "lucide-react";
import { DnaStatCard } from "@/components/dna";

interface BayarSampleKpiCardsProps {
  totalOutstanding: number;
  totalPaid: number;
  awaitingPayment: number;
  totalSamples: number;
}

export function BayarSampleKpiCards({
  totalOutstanding,
  totalPaid,
  awaitingPayment,
  totalSamples,
}: BayarSampleKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <DnaStatCard
        label="Total Outstanding"
        value={`Rp ${totalOutstanding.toLocaleString("id-ID")}`}
        icon={<Wallet className="text-rose-500" />}
      />
      <DnaStatCard
        label="Telah Dibayar"
        value={`Rp ${totalPaid.toLocaleString("id-ID")}`}
        icon={<CheckCircle2 className="text-emerald-600" />}
      />
      <DnaStatCard
        label="Menunggu Bayar"
        value={awaitingPayment.toString()}
        subValue="Sample pending"
        icon={<Clock className="text-amber-500" />}
      />
      <DnaStatCard
        label="Total Samples"
        value={`${totalSamples} Order`}
        icon={<FileCheck2 className="text-blue-600" />}
      />
    </div>
  );
}
