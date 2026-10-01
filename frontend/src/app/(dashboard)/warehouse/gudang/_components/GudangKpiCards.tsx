"use client";

import React from "react";
import { Warehouse, Boxes, CheckCircle2, ThermometerSnowflake } from "lucide-react";
import { DnaKpiGrid, DnaStatCard } from "@/components/dna";

interface GudangKpiCardsProps {
  warehousesCount: number;
  binsCount: number;
}

export function GudangKpiCards({ warehousesCount, binsCount }: GudangKpiCardsProps) {
  return (
    <DnaKpiGrid cols={4}>
      <DnaStatCard
        label="Total Fasilitas Gudang"
        value={`${warehousesCount} Nodes`}
        subtext="Gudang Operasional Aktif"
        icon={<Warehouse className="w-5 h-5 text-blue-600" />}
        variant="info"
      />
      <DnaStatCard
        label="Total Lokasi Rak & Bin"
        value={`${binsCount} Slots`}
        subtext="Kapasitas Penyimpanan Terdaftar"
        icon={<Boxes className="w-5 h-5 text-indigo-600" />}
        variant="purple"
      />
      <DnaStatCard
        label="Rata-Rata Utilisasi"
        value="68.4%"
        subtext="Occupancy Ruang Penyimpanan"
        icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        variant="success"
      />
      <DnaStatCard
        label="Zona Cool Room"
        value="2 Gudang"
        subtext="Suhu Terjaga 15 - 25°C"
        icon={<ThermometerSnowflake className="w-5 h-5 text-cyan-600" />}
        variant="info"
      />
    </DnaKpiGrid>
  );
}
