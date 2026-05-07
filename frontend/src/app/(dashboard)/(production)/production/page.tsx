import React, { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import ProductionDashboardWrapper from "./ProductionDashboardWrapper";
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

export default async function ProductionDashboardPage() {
  const queryClient = new QueryClient();

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["prodDashboard"],
      queryFn: () => fetchFromApi("/production/dashboard"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["oeeStats"],
      queryFn: () => fetchFromApi("/production/oee"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["chainOfCustody"],
      queryFn: () => fetchFromApi("/production/chain-of-custody"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={
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
      }>
        <ProductionDashboardWrapper />
      </Suspense>
    </HydrationBoundary>
  );
}
