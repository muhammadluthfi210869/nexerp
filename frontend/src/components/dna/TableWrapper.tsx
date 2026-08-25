import { cn } from "@/lib/utils"

interface TableWrapperProps {
  children: React.ReactNode
  className?: string
  filters?: React.ReactNode
}

export function TableWrapper({ children, className, filters }: TableWrapperProps) {
  return (
    <div className={cn("erp-table-shell rounded-[var(--table-radius)] border border-[var(--border-color)] shadow-[var(--table-shadow)] overflow-hidden bg-white animate-fade-slide-in", className)}>
      {filters && (
        <div className="erp-table-toolbar border-b border-slate-100 bg-white">
          {filters}
        </div>
      )}
      <div className="erp-table-scroll">
        {children}
      </div>
    </div>
  )
}
