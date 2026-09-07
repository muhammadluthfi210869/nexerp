import { cn } from "@/lib/utils"

interface TableWrapperProps {
  children: React.ReactNode
  className?: string
  filters?: React.ReactNode
  pagination?: React.ReactNode
}

export function TableWrapper({ children, className, filters, pagination }: TableWrapperProps) {
  return (
    <div className={cn("rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden bg-white dark:bg-[#0c1322] animate-fade-slide-in", className)}>
      {filters && (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c1322]">
          {filters}
        </div>
      )}
      {children}
      {pagination && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0c1322]">
          {pagination}
        </div>
      )}
    </div>
  )
}
