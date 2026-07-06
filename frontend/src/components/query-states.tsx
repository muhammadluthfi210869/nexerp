"use client";

import React from "react";
import { Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryLoadingProps {
  message?: string;
  minHeight?: string;
}

export function QueryLoading({ message = "Loading data...", minHeight = "min-h-[200px]" }: QueryLoadingProps) {
  return (
    <div className={`${minHeight} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

interface QueryErrorProps {
  error: unknown;
  onRetry: () => void;
  message?: string;
  minHeight?: string;
}

export function QueryError({ error, onRetry, message, minHeight = "min-h-[200px]" }: QueryErrorProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <div className={`${minHeight} flex items-center justify-center`}>
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">{message || "Failed to load data"}</h3>
          <p className="text-xs text-slate-400 mt-1">{errorMessage}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-xl">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
}

interface SkeletonRow {
  width: string;
}

interface QuerySkeletonProps {
  rows?: SkeletonRow[];
  minHeight?: string;
}

export function QuerySkeleton({ rows, minHeight = "min-h-[200px]" }: QuerySkeletonProps) {
  const defaultRows: SkeletonRow[] = [
    { width: "100%" }, { width: "80%" }, { width: "60%" },
    { width: "90%" }, { width: "70%" },
  ];

  return (
    <div className={`${minHeight} space-y-3 p-4`}>
      {(rows || defaultRows).map((row, i) => (
        <div
          key={i}
          className="h-4 bg-slate-100 rounded animate-pulse"
          style={{ width: row.width }}
        />
      ))}
    </div>
  );
}
