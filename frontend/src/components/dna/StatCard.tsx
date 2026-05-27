import React from "react"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, subValue, icon, className }: StatCardProps) {
  const iconEl = React.isValidElement(icon) ? icon : null
  const bgIcon = React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-[110px] h-[110px] stroke-[0.75px] text-slate-300/25 transition-all duration-700",
      })
    : null

  return (
    <div
      className={cn(
        "bg-white border border-[var(--border-color)] rounded-[24px] p-7 shadow-sm transition-all group overflow-hidden relative h-[148px] flex items-center justify-between animate-fade-slide-in",
        className
      )}
    >
      <div className="flex justify-between items-center relative z-10 w-full">
        <div className="space-y-2 flex-1 min-w-0 pr-4">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] group-hover:text-slate-900 transition-colors">
            {label}
          </p>
          <h3 className="text-[32px] font-black text-slate-900 tracking-[-0.02em] tabular leading-tight">
            {value ?? "—"}
          </h3>
          {subValue && (
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
              {subValue}
            </p>
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
