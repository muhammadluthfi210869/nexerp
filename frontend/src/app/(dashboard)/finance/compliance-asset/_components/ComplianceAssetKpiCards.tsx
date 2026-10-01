"use client";

import React from "react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";
import { Award, Clock, ShieldAlert, FileText } from "lucide-react";

interface ComplianceAssetKpiCardsProps {
  activeCount: number;
  warningCount: number;
  expiredCount: number;
  totalAmortMonth: number;
}

export function ComplianceAssetKpiCards({
  activeCount,
  warningCount,
  expiredCount,
  totalAmortMonth,
}: ComplianceAssetKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Sertifikasi Aktif"
        value={`${activeCount} Sertifikat`}
        variant="emerald"
        icon={<Award className="h-4 w-4" />}
        delta={{ value: "Dalam Masa Berlaku", isPositive: true }}
      />
      <DnaStatCard
        label="Mendekati Kadaluarsa (< 60 Hari)"
        value={`${warningCount} Izin`}
        variant="amber"
        icon={<Clock className="h-4 w-4" />}
        delta={{ value: "Perlu Perpanjangan Segera", isPositive: false }}
      />
      <DnaStatCard
        label="Telah Kadaluarsa"
        value={`${expiredCount} Dokumen`}
        variant="danger"
        icon={<ShieldAlert className="h-4 w-4" />}
        delta={{ value: "Segera Proses Ulang", isPositive: false }}
      />
      <DnaStatCard
        label="Total Beban Amortisasi Bulanan"
        value={formatRupiah(totalAmortMonth)}
        variant="blue"
        icon={<FileText className="h-4 w-4" />}
        delta={{ value: "Beban Amortisasi Berjalan", isPositive: true }}
      />
    </DnaKpiGrid>
  );
}
