"use client";

import React from "react";
import { Thermometer, CloudRain } from "lucide-react";
import { StatCard, DataCard, DnaBadge } from "@/components/dna";

interface StabilityKpiCardsProps {
  studiesCount: number;
}

export function StabilityKpiCards({ studiesCount }: StabilityKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard
        label="Chamber A: Accelerated"
        value="40Â°C"
        subValue="75% RH / Status: Operating within scientific threshold"
        icon={<Thermometer className="h-4 w-4" />}
      />
      <StatCard
        label="Chamber B: Real-Time"
        value="25Â°C"
        subValue="60% RH / Status: Stable"
        icon={<CloudRain className="h-4 w-4" />}
      />
      <DataCard
        title="Active Studies"
        className="bg-blue-600 text-white relative overflow-hidden"
        titleColor="text-blue-200"
      >
        <h3 className="text-4xl font-black text-white mt-2">
          {studiesCount} <span className="text-lg font-light">Samples</span>
        </h3>
        <div className="flex gap-2">
          <DnaBadge variant="default" className="bg-white/10 text-white border-none">
            Skin: 8
          </DnaBadge>
          <DnaBadge variant="default" className="bg-white/10 text-white border-none">
            Color: 4
          </DnaBadge>
        </div>
      </DataCard>
    </div>
  );
}
