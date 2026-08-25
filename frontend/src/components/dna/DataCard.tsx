import { cn } from "@/lib/utils"

interface DataCardProps {
  dotColor?: string
  title?: string
  titleColor?: string
  children: React.ReactNode
  className?: string
  noShadow?: boolean
}

export function DataCard({ dotColor, title, titleColor, children, className, noShadow }: DataCardProps) {
  return (
    <div
      className={cn(
        "erp-data-card bg-white border border-[var(--border-color)] rounded-[16px] p-6 flex flex-col h-full transition-shadow animate-fade-slide-in",
        noShadow ? "" : "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]",
        className
      )}
    >
      {(dotColor || title) && (
        <div className="flex items-center gap-3 mb-5">
          {dotColor && <span className={cn("status-dot", dotColor)} />}
          {title && (
            <h3 className={cn("text-xs font-bold tracking-wide", titleColor || "text-slate-400")}>
              {title}
            </h3>
          )}
        </div>
      )}
      <div className="flex-1 space-y-4">
        {children}
      </div>
    </div>
  )
}
