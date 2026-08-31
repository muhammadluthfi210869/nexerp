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
    <section
      className={cn(
        "rounded-[12px] border border-[#E2E8F0] bg-white overflow-hidden",
        className,
      )}
      aria-label={title ?? "Data table"}
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {title && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-4 w-1 rounded-full bg-blue-600 shrink-0" />
              <h3 className="text-[13px] font-semibold text-slate-900 truncate">{title}</h3>
              <span className="text-[11px] font-medium text-slate-400 tabular-nums">{totalRows}</span>
            </div>
          )}
          {enableSearch && (
            <label className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-slate-50 text-slate-400 min-w-[220px]">
              <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
              <input
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                placeholder={searchPlaceholder}
                type="search"
                className="w-full bg-transparent border-0 outline-0 text-[12px] text-slate-700 placeholder:text-slate-400"
              />
            </label>
          )}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {toolbar}
          {enableColumnVisibility && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumns((value) => !value)}
                aria-expanded={showColumns}
                className="h-9 px-3 inline-flex items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                <Columns3 aria-hidden="true" className="h-4 w-4" /> Kolom
              </button>
              {showColumns && (
                <div className="absolute right-0 top-10 z-10 min-w-[180px] rounded-lg border border-[#E2E8F0] bg-white p-2">
                  {table.getAllLeafColumns().filter((column) => column.getCanHide()).map((column) => (
                    <label key={column.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded text-[12px]">
                      <input
                        type="checkbox"
                        checked={column.getIsVisible()}
                        onChange={column.getToggleVisibilityHandler()}
                        className="rounded border-[#E2E8F0]"
                      />
                      <span className="text-slate-700">{typeof column.columnDef.header === "string" ? column.columnDef.header : column.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-slate-50/70 border-b border-[#E2E8F0]">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className="h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 text-inherit"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? <ChevronUp className="h-3 w-3" aria-hidden="true" /> : sorted === "desc" ? <ChevronDown className="h-3 w-3" aria-hidden="true" /> : <ChevronsUpDown className="h-3 w-3 text-slate-300" aria-hidden="true" />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="h-[80px] text-center text-[12px] text-slate-400">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-200 border-t-blue-600 animate-spin align-middle mr-2" />
                  Memuat...
                </td>
              </tr>
            ) : visibleRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center">
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <p className="text-[13px] font-medium text-slate-700">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="h-[44px] px-4 text-[13px] text-slate-700 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#E2E8F0] text-[11px] text-slate-500">
          <span>Halaman {pageCount === 0 ? 0 : currentPage} dari {pageCount}</span>
          <label className="flex items-center gap-2">
            Baris
            <select
              value={table.getState().pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
              className="h-7 px-2 rounded border border-[#E2E8F0] bg-white text-[12px]"
            >
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Halaman sebelumnya"
              disabled={!canPrevious}
              onClick={() => table.previousPage()}
              className="h-8 w-8 grid place-items-center rounded-md border border-[#E2E8F0] bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Halaman berikutnya"
              disabled={!canNext}
              onClick={() => table.nextPage()}
              className="h-8 w-8 grid place-items-center rounded-md border border-[#E2E8F0] bg-white text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
