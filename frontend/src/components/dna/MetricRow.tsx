import { cn } from "@/lib/utils"

interface MetricRowProps {
  label: string
  value: string | number
  percentage?: number
  dotColor?: string
  barColor?: string
  className?: string
}

export function MetricRow({ label, value, percentage, dotColor, barColor, className }: MetricRowProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-2">
          {dotColor && <span className={cn("status-dot", dotColor)} />}
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider leading-tight">
            {label}
          </span>
        </span>
        <span className="text-[13px] font-black text-slate-900 tracking-tight tabular leading-tight">
          {value}
          {percentage !== undefined && <span className="text-slate-400 ml-1 font-bold">({percentage}%)</span>}
        </span>
      </div>
      {percentage !== undefined && (
        <div className="row-progress-bg">
          <div
            className={cn("row-progress-fill", barColor || "bg-blue-500")}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      )}
    </div>
  )
}
