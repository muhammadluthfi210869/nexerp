import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette } from "lucide-react";

export default function CreativeLoading() {
  return (
    <div className="p-10 bg-slate-50/50 min-h-screen animate-pulse">
      <header className="flex justify-between items-end mb-12">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl bg-slate-200" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-64 bg-slate-200" />
            <Skeleton className="h-3 w-48 bg-slate-200" />
          </div>
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-14 w-80 bg-white rounded-2xl" />
          <Skeleton className="h-14 w-40 bg-slate-200 rounded-2xl" />
        </div>
      </header>

      {/* Kanban Skeleton */}
      <div className="grid grid-cols-4 gap-8 h-[600px]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-slate-100/50 rounded-3xl p-6 space-y-4">
            <Skeleton className="h-6 w-32 bg-slate-200" />
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-32 w-full bg-white rounded-2xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

