"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DnaPageContainerProps {
  children: React.ReactNode;
  alert?: React.ReactNode;
  className?: string;
}

/**
 * Canonical Page Container for NEX ERP Operational Views.
 * Fully transparent to inherit dark/light theme background seamlessly.
 */
export function DnaPageContainer({ children, alert, className }: DnaPageContainerProps) {
  return (
    <div className={cn("space-y-6 pb-20 text-slate-900 dark:text-slate-100 bg-transparent min-h-screen", className)}>
      {alert}
      {children}
    </div>
  );
}
