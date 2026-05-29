import React, { Suspense } from "react";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { PipelineContent } from "./PipelineContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

async function fetchFromApi(path: string) {
  try {
    const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function RndPipelinePage() {
  const queryClient = new QueryClient();

  // Prefetch data from NestJS API (no direct Prisma)
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["rnd-samples"],
      queryFn: () => fetchFromApi("/rnd/samples"),
    }),
    queryClient.prefetchQuery({
      queryKey: ["rnd-staffs"],
      queryFn: () => fetchFromApi("/rnd/staffs"),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PipelineSkeleton />}>
        <PipelineContent />
      </Suspense>
    </HydrationBoundary>
  );
}

function PipelineSkeleton() {
  return (
    <div className="p-8 space-y-8 bg-base min-h-screen animate-pulse">
      <div className="h-40 w-full bg-white rounded-xl border border-slate-200" />
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200" />
        ))}
      </div>
      <div className="h-[600px] bg-white rounded-xl border border-slate-200" />
    </div>
  );
}

