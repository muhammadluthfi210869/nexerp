"use client";

import React from "react";
import { DnaTabNav, Input } from "@/components/dna";
import { Truck, ArrowRightLeft, PackageCheck, Scan, Zap } from "lucide-react";

interface WorkstationTabHeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function WorkstationTabHeader({
  activeTab,
  setActiveTab,
}: WorkstationTabHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
      <DnaTabNav
        tabs={[
          { id: "procurement", label: "01. PROCUREMENT", icon: Truck },
          { id: "internal", label: "02. INTERNAL", icon: ArrowRightLeft },
          { id: "logistics", label: "03. LOGISTICS", icon: PackageCheck },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="relative w-full max-w-sm group">
        <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
        <Input
          placeholder="SCAN BATCH / REQUISITION..."
          className="h-12 pl-12 bg-white border-zinc-200 rounded-xl text-xs font-semibold uppercase tracking-wider placeholder:text-zinc-400 shadow-sm focus:border-zinc-900 focus:ring-zinc-900/10"
        />
        <Zap className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-300 animate-pulse" />
      </div>
    </div>
  );
}
