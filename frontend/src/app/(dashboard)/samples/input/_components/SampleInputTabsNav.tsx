"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/dna";

export function SampleInputTabsNav() {
  return (
    <div className="flex items-center justify-between">
      <TabsList className="bg-slate-100 p-1 rounded-xl border border-slate-200">
        <TabsTrigger
          value="paid"
          className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
        >
          Paid Analytics
        </TabsTrigger>
        <TabsTrigger
          value="organic"
          className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
        >
          Organic Health
        </TabsTrigger>
        <TabsTrigger
          value="content"
          className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
        >
          Content Asset
        </TabsTrigger>
        <TabsTrigger
          value="targets"
          className="rounded-lg px-8 py-2.5 font-bold text-[11px] uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all"
        >
          KPI Targets
        </TabsTrigger>
      </TabsList>

      <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-tight">
          Auto-Save Active
        </span>
      </div>
    </div>
  );
}
