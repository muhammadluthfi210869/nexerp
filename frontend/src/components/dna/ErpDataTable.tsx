"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronUp, Columns3, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ErpDataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  getRowId?: (row: TData, index: number) => string
  title?: string
  searchPlaceholder?: string
  pageSize?: number
  pageSizeOptions?: number[]
  enableSearch?: boolean
  enableColumnVisibility?: boolean
  loading?: boolean
  emptyMessage?: string
  className?: string
  toolbar?: React.ReactNode
}

function valueForSearch(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

export function ErpDataTable<TData>({
  data,
  columns,
  getRowId,
  title,
  searchPlaceholder = "Search this table...",
  pageSize = 10,
  pageSizeOptions = [10, 25, 50],
  enableSearch = true,
  enableColumnVisibility = true,
  loading = false,
  emptyMessage = "Tidak ada data yang sesuai.",
  className,
  toolbar,
}: ErpDataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [showColumns, setShowColumns] = React.useState(false)

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()
      if (!query) return true
      return row.getAllCells().some((cell) => valueForSearch(cell.getValue()).toLowerCase().includes(query))
    },
    initialState: { pagination: { pageSize } },
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const visibleRows = table.getRowModel().rows
  const totalRows = table.getFilteredRowModel().rows.length
  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const canPrevious = table.getCanPreviousPage()
  const canNext = table.getCanNextPage()

  return (
    <section className={cn("erp-table-shell erp-data-table", className)} aria-label={title ?? "Data table"}>
      <div className="erp-table-toolbar">
        <div className="erp-table-toolbar-content">
          {title && <div className="erp-data-table-title">{title}</div>}
          {enableSearch && (
            <label className="erp-table-toolbar-search" aria-label={searchPlaceholder}>
              <Search aria-hidden="true" className="h-4 w-4 shrink-0" />
              <input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder={searchPlaceholder}
                type="search"
              />
            </label>
          )}
          <span className="erp-table-result-label" aria-live="polite">{totalRows} hasil</span>
          <div className="erp-table-toolbar-actions">
            {toolbar}
            {enableColumnVisibility && (
              <div className="erp-data-table-columns">
                <button type="button" onClick={() => setShowColumns((value) => !value)} aria-expanded={showColumns}>
                  <Columns3 aria-hidden="true" /> Kolom
                </button>
                {showColumns && (
                  <div className="erp-data-table-columns-menu" role="menu">
                    {table.getAllLeafColumns().filter((column) => column.getCanHide()).map((column) => (
                      <label key={column.id}>
                        <input type="checkbox" checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />
                        <span>{typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="erp-table-scroll" tabIndex={0} aria-label="Scrollable data table">
        <table>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  const sorted = header.column.getIsSorted()
                  return (
                    <th key={header.id} colSpan={header.colSpan} aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button type="button" className="erp-data-table-sort" onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? <ChevronUp aria-hidden="true" /> : sorted === "desc" ? <ChevronDown aria-hidden="true" /> : <ChevronsUpDown aria-hidden="true" />}
                        </button>
                      ) : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length} className="erp-data-table-state">Memuat data...</td></tr>
            ) : visibleRows.length === 0 ? (
              <tr><td colSpan={columns.length} className="erp-data-table-state">{emptyMessage}</td></tr>
            ) : visibleRows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <footer className="erp-data-table-pagination">
        <span>Halaman {pageCount === 0 ? 0 : currentPage} dari {pageCount}</span>
        <label>Baris
          <select value={table.getState().pagination.pageSize} onChange={(event) => table.setPageSize(Number(event.target.value))}>
            {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>
        <div className="erp-data-table-pagination-actions">
          <button type="button" aria-label="Halaman sebelumnya" disabled={!canPrevious} onClick={() => table.previousPage()}><ChevronLeft aria-hidden="true" /></button>
          <button type="button" aria-label="Halaman berikutnya" disabled={!canNext} onClick={() => table.nextPage()}><ChevronRight aria-hidden="true" /></button>
        </div>
      </footer>
    </section>
  )
}
