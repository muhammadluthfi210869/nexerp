"use client";

import React from "react";
import { Calendar, FlaskConical, Package, Boxes } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface SampleScheduleKpiCardsProps {
  totalSchedules: number;
  mixingCount: number;
  fillingCount: number;
  packagingCount: number;
}

export function SampleScheduleKpiCards({
  totalSchedules,
  mixingCount,
  fillingCount,
  packagingCount,
}: SampleScheduleKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="TOTAL JADWAL TERENCANA"
        value={`${totalSchedules} Sesi`}
        subValue="Timeline Batch Pra-Produksi"
        icon={<Calendar className="w-5 h-5 text-blue-600" />}
      />
      <DnaStatCard
        label="JADWAL MIXING BEJANA"
        value={`${mixingCount} Batch`}
        subValue="Peleburan & Homogenisasi"
        icon={<FlaskConical className="w-5 h-5 text-indigo-600" />}
      />
      <DnaStatCard
        label="JADWAL FILLING KEMASAN"
        value={`${fillingCount} Line`}
        subValue="Pengisian Botol & Tube"
        icon={<Package className="w-5 h-5 text-cyan-600" />}
      />
      <DnaStatCard
        label="JADWAL PACKAGING & BOX"
        value={`${packagingCount} Line`}
        subValue="Finishing Box & Master Carton"
        icon={<Boxes className="w-5 h-5 text-emerald-600" />}
      />
    </DnaKpiGrid>
  );
}
