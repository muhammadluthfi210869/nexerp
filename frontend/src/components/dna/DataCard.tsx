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
        "bg-white border border-[var(--border-color)] rounded-[24px] p-8 flex flex-col h-full transition-all animate-fade-slide-in hover:translate-y-[-4px] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05)]",
        noShadow ? "" : "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)]",
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
