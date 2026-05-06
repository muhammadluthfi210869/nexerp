import React from "react";
import { cn } from "@/lib/utils";

interface KPIGridProps {
  columns?: 4 | 5;
  children: React.ReactNode;
}

/**
 * Standardized KPI card grid with enforced column count and gap.
 * Ensures all dashboard pages show KPI cards with identical density.
 */
export function KPIGrid({ columns = 4, children }: KPIGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2",
        columns === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3 xl:grid-cols-5"
      )}
      style={{ gap: 'var(--card-gap)' }}
    >
      {children}
    </div>
  );
}

interface KPICardProps {
  id?: string;
  title: string;
  icon?: React.ReactNode;
  dotColor?: string;
  variant?: "default" | "danger";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Standardized KPI card with enforced padding, radius, and internal layout.
 * Every KPI card across the ERP will have identical proportions.
 */
export function KPICard({ id, title, icon, dotColor = "bg-primary", variant = "default", children, footer }: KPICardProps) {
  const isDanger = variant === "danger";

  return (
    <div
      className={cn(
        "bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between group",
        isDanger && "bg-brand-black text-white border-none shadow-xl"
      )}
      style={{
        padding: 'var(--card-py) var(--card-px)',
        borderRadius: 'var(--card-radius)',
      }}
    >
      <div className="relative z-10 h-full flex flex-col justify-between">
        {/* Card Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {dotColor && <div className={cn("w-1.5 h-1.5 rounded-full", dotColor)} />}
              <h3 className={cn(
                "text-[10px] font-black uppercase tracking-tight",
                isDanger ? "text-white/70" : "text-slate-500"
              )}>
                {title}
              </h3>
            </div>
            {id && (
              <span className={cn(
                "text-[9px] font-black uppercase tracking-tight",
                isDanger ? "text-white/30" : "text-slate-300"
              )}>
                {id}
              </span>
            )}
          </div>

          {/* Card Content — provided by consumer */}
          <div className="space-y-3">
            {children}
          </div>
        </div>

        {/* Card Footer */}
        {footer && (
          <div className={cn(
            "mt-4 pt-3 border-t",
            isDanger ? "border-white/10" : "border-slate-100"
          )}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

