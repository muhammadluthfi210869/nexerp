import React, { Suspense } from "react";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import LandingTrackerClient from "./LandingTrackerClient";
import { TableShell } from "@/components/layout/TableShell";

export default function LandingTrackerPage() {
  return (
    <TableShell title="Landing" titleAccent="Tracker">
      <Suspense fallback={
        <div className="p-8 space-y-8">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-50 rounded-3xl animate-pulse" />
            ))}
          </div>
          <ChartSkeleton height={350} />
          <ChartSkeleton height={350} />
        </div>
      }>
        <LandingTrackerClient />
      </Suspense>
    </TableShell>
  );
}
