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
        "bg-white border border-[var(--border-color)] rounded-[24px] py-8 px-8 flex flex-col h-full transition-all animate-fade-slide-in",
        noShadow ? "" : "shadow-card",
        className
      )}
    >
      {(dotColor || title) && (
        <div className="flex items-center gap-3 mb-7">
          {dotColor && <span className={cn("status-dot", dotColor)} />}
          {title && (
            <h3 className={cn("text-[10px] font-black uppercase tracking-[0.25em]", titleColor || "text-slate-400")}>
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
