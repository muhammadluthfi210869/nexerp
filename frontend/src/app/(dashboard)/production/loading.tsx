import React from "react";
import { KPIGrid } from "@/components/layout/KPIGrid";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductionLoading() {
  return (
    <div className="min-h-screen bg-[#05070a] p-8 space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Skeleton className="h-2 w-32 bg-emerald-500/10" />
          <Skeleton className="h-14 w-96 bg-slate-900" />
          <Skeleton className="h-4 w-64 bg-slate-900" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 w-40 bg-slate-900 rounded-2xl" />
          <Skeleton className="h-14 w-40 bg-slate-900 rounded-2xl" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <KPIGrid>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-slate-900/40 border border-slate-800 rounded-[2.5rem]" />
        ))}
      </KPIGrid>

      {/* Content Skeleton */}
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 h-[600px] bg-slate-900/40 border border-slate-800 rounded-[2.5rem]" />
        <div className="col-span-1 h-[600px] bg-slate-900/40 border border-slate-800 rounded-[2.5rem]" />
      </div>
    </div>
  );
}

