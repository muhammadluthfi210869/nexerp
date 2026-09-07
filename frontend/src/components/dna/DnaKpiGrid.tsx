"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DnaKpiGridProps {
  children: React.ReactNode;
  cols?: number;
  className?: string;
}

/**
 * Standard 4-column KPI Card Grid Layout.
 * Desktop KPI Limit: Maximum 4 cards / row (Prevents orphan 4+1 layout).
 * Base Rhythm: gap-3.5 mt-6
 */
export function DnaKpiGrid({ children, cols = 4, className }: DnaKpiGridProps) {
  const colClass = cols === 2 ? "lg:grid-cols-2" : cols === 3 ? "lg:grid-cols-3" : cols === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6", colClass, className)}>
      {children}
    </div>
  );
}
