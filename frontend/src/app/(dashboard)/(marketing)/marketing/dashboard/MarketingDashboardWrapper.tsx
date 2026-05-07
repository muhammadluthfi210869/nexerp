"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";

const MarketingDashboardClient = dynamic(() => import("./MarketingDashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="p-8 space-y-8">
      <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 bg-slate-50 rounded-3xl animate-pulse" />
        ))}
      </div>
      <ChartSkeleton height={350} />
      <ChartSkeleton height={350} />
    </div>
  ),
});

export default function MarketingDashboardWrapper() {
  return <MarketingDashboardClient />;
}
