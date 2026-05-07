import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap } from "lucide-react";

export default function MarketingLoading() {
  return (
    <div className="p-8 space-y-10 bg-base min-h-screen animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-4">
          <Skeleton className="h-4 w-48 bg-blue-100" />
          <Skeleton className="h-12 w-96 bg-slate-200" />
          <Skeleton className="h-4 w-64 bg-slate-100" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 w-40 bg-white rounded-2xl" />
          <Skeleton className="h-14 w-40 bg-blue-100 rounded-2xl" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="h-16 w-[500px] bg-white rounded-3xl" />

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-80 bg-white rounded-[40px] shadow-sm" />
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[450px] bg-white rounded-[32px] shadow-sm" />
        ))}
      </div>
    </div>
  );
}

