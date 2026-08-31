"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  SectionCard as CanonicalSectionCard,
  SectionCardContent,
} from "@/components/canonical";

interface DashboardCardProps {
  label?: string;
  labelClassName?: string;
  children: React.ReactNode;
  className?: string;
  inverted?: boolean;
  style?: React.CSSProperties;
}

/**
 * Canonical-aligned DashboardCard. Wraps canonical SectionCard.
 * Provides optional legacy `label` header and `inverted` dark variant.
 */
export function DashboardCard({ label, labelClassName, children, className, inverted, style }: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#E2E8F0] transition-shadow",
        inverted ? "bg-slate-900 text-white border-slate-800" : "bg-white",
        className,
      )}
      style={style}
    >
      {label && (
        <div
          className={cn(
            "px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider",
            inverted ? "text-slate-300" : "text-slate-500",
            labelClassName,
          )}
        >
          {label}
        </div>
      )}
      <div className={cn("px-5", label ? "pb-4" : "py-4")}>{children}</div>
    </div>
  );
}

// Re-export canonical primitives for convenience
export { CanonicalSectionCard as SectionCard, SectionCardContent };
