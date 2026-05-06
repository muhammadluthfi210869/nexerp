import React from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import BussdevDashboardClient from "./BussdevDashboardClient";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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

export default async function BussdevDashboardPage() {
  const queryClient = new QueryClient();

  // Prefetch data on the server from NestJS API (no direct Prisma)
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["dashboardAnalytics"],
      queryFn: () => fetchFromApi("/bussdev/analytics"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["granularPipeline"],
      queryFn: () => fetchFromApi("/bussdev/pipeline"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BussdevDashboardClient />
    </HydrationBoundary>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    "MELAMPAUI TARGET": "bg-emerald-500 text-white",
    "SESUAI TARGET": "bg-brand-black text-white",
    "BAWAH TARGET": "bg-rose-500 text-white",
  };
  return (
    <Badge
      className={cn(
        "border-none font-black text-[8px] uppercase py-0.5 px-2.5 shadow-sm",
        styles[status]
      )}
    >
      {status}
    </Badge>
  );
}

