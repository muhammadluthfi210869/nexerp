"use client";

import React from "react";
import { FileEdit, Truck, PackageCheck, Receipt } from "lucide-react";
import { DnaStatCard } from "@/components/dna";

interface PurchasingKpiCardsProps {
  pendingPrCount: string;
  activePoCount: string;
  awaitingGrnCount: string;
  totalPoValue: number;
}

export function PurchasingKpiCards({
  pendingPrCount,
  activePoCount,
  awaitingGrnCount,
  totalPoValue,
}: PurchasingKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <DnaStatCard label="PR Menunggu" value={pendingPrCount} icon={<FileEdit />} variant="blue" />
      <DnaStatCard label="PO Aktif" value={activePoCount} icon={<Truck />} variant="blue" />
      <DnaStatCard label="Menunggu GRN" value={awaitingGrnCount} icon={<PackageCheck />} variant="emerald" />
      <DnaStatCard
        label="Total Nilai PO"
        value={`Rp ${(totalPoValue / 1000000).toFixed(1)}jt`}
        icon={<Receipt />}
        variant="amber"
      />
    </div>
  );
}
