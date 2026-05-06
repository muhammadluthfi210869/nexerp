"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";

const ProductionDashboardClient = dynamic(() => import("./ProductionDashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="h-8 w-48 bg-slate-100 rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-slate-50 rounded-3xl" />
        ))}
      </div>
      <ChartSkeleton height={350} />
      <ChartSkeleton height={350} />
    </div>
  ),
});

export default function ProductionDashboardWrapper() {
  return <ProductionDashboardClient />;
}
