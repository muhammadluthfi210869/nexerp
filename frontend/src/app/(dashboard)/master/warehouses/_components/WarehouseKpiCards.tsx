"use client";

import React from "react";
import { Warehouse, Layers, Box, CheckCircle2 } from "lucide-react";
import { DnaKpiGrid } from "@/components/dna";

interface WarehouseKpiCardsProps {
  totalWarehouses: number;
  sidoarjoHubs: number;
  pasuruanHubs: number;
  totalBins: number;
}

export function WarehouseKpiCards({
  totalWarehouses,
  sidoarjoHubs,
  pasuruanHubs,
  totalBins,
}: WarehouseKpiCardsProps) {
  return (
    <DnaKpiGrid
      cards={[
        {
          key: "ALL",
          title: "TOTAL TITIK GUDANG",
          value: totalWarehouses.toLocaleString("id-ID"),
          icon: <Warehouse className="w-4 h-4" />,
          iconBg: "bg-blue-50",
          iconColor: "text-blue-600",
        },
        {
          key: "Sidoarjo",
          title: "HUB SIDOARJO",
          value: `${sidoarjoHubs} Fasilitas`,
          icon: <Layers className="w-4 h-4" />,
          iconBg: "bg-sky-50",
          iconColor: "text-sky-600",
        },
        {
          key: "Pasuruan",
          title: "HUB PASURUAN (PIER)",
          value: `${pasuruanHubs} Fasilitas`,
          icon: <Box className="w-4 h-4" />,
          iconBg: "bg-amber-50",
          iconColor: "text-amber-600",
        },
        {
          key: "CAPACITY",
          title: "KAPASITAS BIN / PALLET",
          value: `${totalBins} Bins`,
          icon: <CheckCircle2 className="w-4 h-4" />,
          iconBg: "bg-emerald-50",
          iconColor: "text-emerald-600",
        },
      ]}
    />
  );
}
