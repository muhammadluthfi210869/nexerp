import React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string | React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, subValue, icon, className }: StatCardProps) {
  const iconEl = React.isValidElement(icon) ? icon : null
  const bgIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-[72px] h-[72px] stroke-[0.75px] text-slate-300/20 transition-opacity duration-200",
      })
    : null

  return (
    <div
      className={cn(
        "erp-metric-card bg-white border border-[var(--border-color)] rounded-[12px] p-5 shadow-sm transition-colors group overflow-hidden relative flex items-center animate-fade-slide-in w-full max-w-[320px] min-w-0 justify-self-start min-h-[136px]",
        className
      )}
    >
      <div className="flex justify-between items-center relative z-10 w-full">
        <div className="space-y-2 flex-1 min-w-0 pr-4">
          <p className="text-xs font-semibold text-slate-500 tracking-normal leading-4 group-hover:text-slate-900 transition-colors">
            {label}
          </p>
          <h3 className="text-[28px] font-black text-slate-900 tracking-[-0.02em] tabular leading-tight">
            {value ?? "—"}
          </h3>
          {subValue && (
            typeof subValue === "string" ? (
              <p className="text-xs font-medium text-slate-400 leading-4">
                {subValue}
              </p>
            ) : (
              <div className="text-xs font-medium leading-4">
                {subValue}
              </div>
            )
          )}
        </div>
        {iconEl && (
          <div className="p-4 bg-slate-50 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shrink-0">
            <span className="[&>svg]:w-[18px] [&>svg]:h-[18px]">
              {iconEl}
            </span>
          </div>
        )}
      </div>
      {bgIcon && (
        <div className="absolute -bottom-5 -right-5 pointer-events-none select-none z-0">
          {bgIcon}
        </div>
      )}
    </div>
  )
}
