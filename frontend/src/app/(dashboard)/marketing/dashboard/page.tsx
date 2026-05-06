import React, { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import MarketingDashboardWrapper from "./MarketingDashboardWrapper";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function fetchFromApi(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function MarketingDashboardPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["marketing-analytics"],
    queryFn: () => fetchFromApi("/marketing/analytics"),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={
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
      }>
        <MarketingDashboardWrapper />
      </Suspense>
    </HydrationBoundary>
  );
}
