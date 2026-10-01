import React from "react";
import {
  Layers,
  ArrowRightLeft,
  CalendarClock,
  Percent,
} from "lucide-react";
import { DnaKpiGrid, formatRupiah } from "@/components/dna";
import {
  CostAllocationKpiCardsProps,
  METHODS,
} from "../_types/cost-allocation-setup.types";

export function CostAllocationKpiCards({
  sourcePools,
  totalAmount,
  totalCount,
  dominantMethod,
  latestAllocationDate,
}: CostAllocationKpiCardsProps) {
  return (
    <DnaKpiGrid
      columns={4}
      items={[
        {
          label: "COST CENTER SUMBER",
          value: `${sourcePools} Sumber`,
          subtext: "Cost center asal alokasi",
          icon: Layers,
          status: "neutral",
        },
        {
          label: "TOTAL BIAYA DIALOKASIKAN",
          value: formatRupiah(totalAmount),
          subtext: `${totalCount} entri alokasi tercatat`,
          icon: ArrowRightLeft,
          status: "success",
        },
        {
          label: "METODE DOMINAN",
          value: dominantMethod,
          subtext: `${METHODS.length} metode didukung`,
          icon: Percent,
          status: "neutral",
        },
        {
          label: "ALOKASI TERAKHIR",
          value: latestAllocationDate,
          subtext: "Tanggal alokasi terbaru",
          icon: CalendarClock,
          status: "neutral",
        },
      ]}
    />
  );
}
