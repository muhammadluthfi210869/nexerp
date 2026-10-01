"use client";

import React from "react";
import { Target, Award, DollarSign, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid, DnaStatCard, formatRupiah } from "@/components/dna";

interface HrKpiCardsProps {
  avgScore: string;
  totalBonus: number;
}

export function HrKpiCards({ avgScore, totalBonus }: HrKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Rata-rata Skor KPI Pabrik"
        value={avgScore + "%"}
        icon={<Target className="w-5 h-5 text-emerald-600" />}
        delta={{ value: "+2.4% vs Q2", isPositive: true }}
        subtext="Target KPI Perusahaan Tercapai"
        variant="success"
      />
      <DnaStatCard
        label="Karyawan Grade A (Top)"
        value="38 Orang"
        icon={<Award className="w-5 h-5 text-purple-600" />}
        subtext="Pencapaian Skor > 90%"
        variant="purple"
      />
      <DnaStatCard
        label="Total Alokasi Bonus Kinerja"
        value={formatRupiah(totalBonus)}
        icon={<DollarSign className="w-5 h-5 text-blue-600" />}
        delta={{ value: "5 Karyawan Terpilih", isPositive: true }}
        subtext="Insentif Prestasi Kuartalan"
        variant="info"
      />
      <DnaStatCard
        label="Tingkat Disiplin Pabrik"
        value="95.6%"
        icon={<CheckCircle2 className="w-5 h-5 text-amber-600" />}
        subtext="Presensi & Keselamatan 5R"
        variant="warning"
      />
    </DnaKpiGrid>
  );
}
