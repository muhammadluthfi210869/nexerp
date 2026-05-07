import React from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/ui/skeleton";

export default function BussdevLoading() {
  return (
    <DashboardShell
      title="Command"
      titleAccent="Center"
      subtitle="Business Development Pipeline & Performance Analytics"
    >
      <div className="space-y-12 animate-pulse">
        {/* Cards Skeleton */}
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 bg-slate-100 rounded-[2.5rem]" />
          ))}
        </div>

        {/* Table Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-64 bg-slate-100" />
          <Skeleton className="h-[400px] w-full bg-slate-100 rounded-2xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 h-96 bg-slate-100 rounded-2xl" />
          <div className="col-span-6 h-96 bg-slate-100 rounded-2xl" />
          <div className="col-span-3 h-96 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </DashboardShell>
  );
}

