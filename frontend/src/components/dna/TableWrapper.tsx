import { cn } from "@/lib/utils"

interface TableWrapperProps {
  children: React.ReactNode
  className?: string
  filters?: React.ReactNode
}

export function TableWrapper({ children, className, filters }: TableWrapperProps) {
  return (
    <div className={cn("rounded-[24px] border border-[var(--border-color)] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02)] overflow-hidden bg-white animate-fade-slide-in", className)}>
      {filters && (
        <div className="p-5 border-b border-slate-50 bg-white">
          {filters}
        </div>
      )}
      {children}
    </div>
  )
}
