import React from "react"
import { Search, SlidersHorizontal, ArrowUpDown, Download } from "lucide-react"
import { cn } from "@/lib/utils"

interface TableToolbarProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onSort?: () => void
  onFilter?: () => void
  onExport?: () => void
  resultLabel?: string
  className?: string
}

/** Shared table controls. Pages can opt into only the actions they support. */
export function TableToolbar({
  searchPlaceholder = "Search this table...",
  searchValue,
  onSearchChange,
  onSort,
  onFilter,
  onExport,
  resultLabel,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("erp-table-toolbar-content", className)}>
      <div className="erp-table-toolbar-search">
        <Search aria-hidden="true" className="h-4 w-4" />
        <input
          aria-label={searchPlaceholder}
          value={searchValue}
          onChange={(event) => onSearchChange?.(event.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      {resultLabel && <span className="erp-table-result-label">{resultLabel}</span>}
      <div className="erp-table-toolbar-actions">
        {onSort && <button type="button" onClick={onSort}><ArrowUpDown aria-hidden="true" /> Sort</button>}
        {onFilter && <button type="button" onClick={onFilter}><SlidersHorizontal aria-hidden="true" /> Filter</button>}
        {onExport && <button type="button" onClick={onExport}><Download aria-hidden="true" /> Export</button>}
      </div>
    </div>
  )
}
