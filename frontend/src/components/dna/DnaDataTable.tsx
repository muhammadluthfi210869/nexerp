/**
 * DnaDataTable — DEPRECATED
 *
 * ⚠️ DEPRECATED (Sprint 9 removal target)
 * This component is a 930-line "everything bagel" that couples page structure,
 * KPI grid, search, column filtering, date filtering, sorting, and pagination
 * into one prop interface. It does not appear in the Golden Reference.
 *
 * Migration path — use compositional pattern instead:
 *   <DnaPageContainer>
 *     <DnaPageHeader title="..." />
 *     <DnaKpiGrid><KpiCard .../></DnaKpiGrid>
 *     <TableWrapper filters={...} pagination={...}>
 *       <DnaTable>...</DnaTable>
 *     </TableWrapper>
 *   </DnaPageContainer>
 *
 * Rationale:
 *   - Golden Reference (dna-visual/golden-reference) uses compositional pattern
 *   - This component cannot be incrementally styled or partially used
 *   - Every prop it adds couples more concerns
 *   - Sprint 9: will be removed once all pages migrate to compositional pattern
 *
 * @deprecated Sprint 9 — use compositional DnaPageContainer + DnaKpiGrid + DnaTable pattern
 * @see /frontend/src/app/(dashboard)/dna-visual/golden-reference/page.tsx
 * @see /plan/NEX_ERP_REFACTOR_ROADMAP.md Sprint 0.5
 */

"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Check,
  FileText,
  RotateCcw,
} from "lucide-react";
import { DnaPageContainer } from "./DnaPageContainer";
import { DnaPageHeader } from "./layout/DnaPageHeader";
import { DnaTabNav, DnaTabItem } from "./DnaTabNav";
import { DnaKpiGrid } from "./layout/DnaKpiGrid";
import { KpiCard } from "./KpiCard";
import { TableWrapper } from "./TableWrapper";
import {
  DnaTable,
  DnaTableHead,
  DnaTableRow,
  DnaTh,
  DnaTableBody,
  DnaTd,
  DnaTdNumber,
  DnaTdCode,
  DnaEmptyState,
} from "./DnaTable";
import { DnaProgress } from "./DnaProgress";
import { DnaDateFilter, type DateFilterValue } from "./DnaDateFilter";
import { DnaColumnFilter, type ColumnOption } from "./DnaColumnFilter";
import { DnaTableRowActions, type DnaTableRowActionsProps } from "./DnaTableRowActions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

export type ColumnType =
  | "index"
  | "code"
  | "primary"
  | "secondary"
  | "text"
  | "status"
  | "badge"
  | "progress"
  | "avatar"
  | "number"
  | "currency"
  | "date"
  | "notes"
  | "custom"
  | (string & {});

export interface DnaColumnDef<T> {
  key?: string;
  label?: string;
  header?: string;
  accessorKey?: string;
  id?: string;
  type?: ColumnType;
  align?: "left" | "center" | "right";
  minWidth?: number | string;
  maxWidth?: number | string;
  width?: number | string;
  className?: string;
  sortable?: boolean;
  sortKey?: keyof T;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  cell?: (row: T, index: number) => React.ReactNode;
  codeOnClick?: (row: T) => void;
  statusMap?: Record<
    string,
    {
      label: string;
      badgeStatus: "emerald" | "amber" | "blue" | "rose" | "purple" | "default";
    }
  >;
  statusOptions?: Array<{
    label: string;
    value: string;
    badgeStatus?: "emerald" | "amber" | "blue" | "rose" | "purple" | "default";
  }>;
  statusConfig?: {
    options: Array<{
      label: string;
      value: string;
      variant?: string;
    }>;
    onStatusChange?: (row: T, newStatus: string) => void;
  };
  onStatusChange?: (row: T, newStatus: string) => void;
  avatarInitialKey?: keyof T;
}

export type DnaColumn<T> = DnaColumnDef<T>;
export type DnaTab = DnaTabItem;
export type { DnaTabItem };

export interface DnaTableRowActionsConfig<T> {
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onPrint?: (row: T) => void;
  extraActions?: (row: T) => Array<{
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: "default" | "danger";
  }>;
}

export interface DnaKpiItem {
  label: string;
  value: string | number;
  trend?: string | { value: string; positive: boolean };
  subtext?: string;
  badge?: { text: string; variant?: string };
  icon?: React.ReactNode;
  variant?: "blue" | "emerald" | "amber" | "rose" | "purple" | "slate" | "default";
  active?: boolean;
  onClick?: () => void;
}

export interface DnaPrimaryAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface DnaDataTableProps<T> {
  // Page Header
  title: string;
  subtitle?: string;
  description?: string;
  badge?: React.ReactNode;
  headerBadge?: React.ReactNode;
  backHref?: string;
  backText?: string;
  onBackClick?: () => void;
  headerRight?: React.ReactNode;
  tabs?: DnaTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;

  // KPI Grid (Max 4)
  kpis?: DnaKpiItem[];

  // Table Data & Columns
  data: T[];
  columns: DnaColumnDef<T>[];
  primaryKey?: string;
  rowKey?: (row: T, index: number) => string;

  // Search
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchFilter?: (row: T, query: string) => boolean;

  // 2-Tier Dynamic Column Filter
  columnFilterOptions?: ColumnOption[];
  selectedColumnId?: string;
  onColumnChange?: (colId: string) => void;
  columnFilterValue?: string;
  onColumnFilterValueChange?: (val: string) => void;

  // Date Filter (Monthly / Range)
  dateFilter?: DateFilterValue;
  onDateFilterChange?: (dateVal: DateFilterValue) => void;

  // Reset & Status
  onResetFilters?: () => void;
  isFiltered?: boolean;

  // Primary Action in Card Toolbar
  primaryAction?: DnaPrimaryAction;
  actionButtonText?: string;
  onActionClick?: () => void;
  extraToolbarActions?: React.ReactNode;

  // Selection Checkbox
  selectable?: boolean;
  selectedRowIds?: string[];
  onSelectAll?: () => void;
  onSelectRow?: (id: string) => void;

  // Row Actions (View, Print, Edit, More)
  rowActions?: ((row: T, index: number) => DnaTableRowActionsProps) | DnaTableRowActionsConfig<T>;

  // Pagination (Frozen Default: 10)
  pageSize?: number;
  pageSizeOptions?: number[];

  // Feedback States
  emptyStateMessage?: string;
  emptyStateDescription?: string;
  isLoading?: boolean;

  // Additional Layout Props
  className?: string;
  children?: React.ReactNode;
}


/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CANONICAL DNA DATA TABLE (Enterprise Visual DNA Standard)
 * ─────────────────────────────────────────────────────────────────────────────
 * Enforces the Golden Reference architecture across all operational pages:
 * 1. Top-right sub-navbar in DnaPageHeader (zero vertical space waste)
 * 2. 1-Row KPI Grid (max 4 cards)
 * 3. Card-Level Unified Toolbar: Search + Column Filter + Month Filter + Reset + Primary CTA
 * 4. Zero-Distance search-to-table (<12px)
 * 5. Strict Atomic Columns (1 Column = 1 Info, non-breaking with whitespace-nowrap)
 * 6. Title Case "Kiri Kata Kanan Panah" status badges
 * 7. Unified Row Actions (View, Print, Edit, Overflow)
 * 8. 10-row canonical pagination default
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function DnaDataTable<T extends Record<string, any>>({
  title,
  subtitle,
  backHref,
  backText,
  onBackClick,
  headerBadge,
  headerRight,
  tabs,
  activeTab,
  onTabChange,
  kpis,
  data,
  columns,
  rowKey = (row, i) => (row.id ? String(row.id) : String(i)),
  searchPlaceholder = "Cari data...",
  searchQuery: controlledSearch,
  onSearchChange: setControlledSearch,
  searchFilter,
  columnFilterOptions,
  selectedColumnId: controlledColId,
  onColumnChange: setControlledColId,
  columnFilterValue: controlledColVal,
  onColumnFilterValueChange: setControlledColVal,
  dateFilter: controlledDateFilter,
  onDateFilterChange: setControlledDateFilter,
  onResetFilters,
  isFiltered: controlledIsFiltered,
  primaryAction,
  extraToolbarActions,
  selectable = false,
  selectedRowIds: controlledSelectedIds,
  onSelectAll: controlledOnSelectAll,
  onSelectRow: controlledOnSelectRow,
  rowActions,
  pageSize: defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  emptyStateMessage = "Tidak ada data yang sesuai filter.",
  emptyStateDescription = "Coba ubah kata kunci pencarian atau reset filter.",
  isLoading = false,
  className,
  children,
}: DnaDataTableProps<T>) {
  // Internal search state if uncontrolled
  const [internalSearch, setInternalSearch] = useState("");
  const searchVal = controlledSearch !== undefined ? controlledSearch : internalSearch;
  const handleSearchChange = (val: string) => {
    if (setControlledSearch) setControlledSearch(val);
    else setInternalSearch(val);
  };

  // Internal pagination state (Frozen default: 10)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: "asc" | "desc" | null;
  }>({ key: null, direction: null });

  const handleSort = (key: keyof T) => {
    setSortConfig((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: null, direction: null };
    });
  };

  // Filter & Search computation
  const filteredData = useMemo(() => {
    let result = data;

    // Apply custom search filter or generic search across columns
    if (searchVal.trim() !== "") {
      const q = searchVal.toLowerCase();
      if (searchFilter) {
        result = result.filter((row) => searchFilter(row, q));
      } else {
        result = result.filter((row) => {
          return Object.values(row).some((val) => {
            if (val === null || val === undefined) return false;
            return String(val).toLowerCase().includes(q);
          });
        });
      }
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
        }
        const strA = String(valA || "").toLowerCase();
        const strB = String(valB || "").toLowerCase();
        if (strA < strB) return sortConfig.direction === "asc" ? -1 : 1;
        if (strA > strB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchVal, searchFilter, sortConfig]);

  // Paginated Data
  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const start = (validPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, validPage, pageSize]);

  // Total columns count for empty state colSpan
  const totalColSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

  // Active filter detection
  const isFilterActive =
    controlledIsFiltered !== undefined
      ? controlledIsFiltered
      : searchVal.trim() !== "" ||
        (controlledColVal && controlledColVal !== "ALL" && controlledColVal !== "");

  const PrimaryIcon = primaryAction?.icon || Plus;

  return (
    <DnaPageContainer className={cn("space-y-5", className)}>
      {/* ── 1. UN-BOXED HEADER & TOP-RIGHT SUB-NAVBAR ── */}
      <DnaPageHeader
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backText={backText}
        onBackClick={onBackClick}
        badge={headerBadge}
        tabs={
          tabs && tabs.length > 0 && activeTab && onTabChange ? (
            <DnaTabNav
              variant="header"
              tabs={tabs}
              activeTab={activeTab}
              onChange={onTabChange}
            />
          ) : null
        }
        action={headerRight}
      />

      {/* ── 2. METRIC KPI CARDS (MAX 4 CARDS) ── */}
      {kpis && kpis.length > 0 && (
        <DnaKpiGrid cols={Math.min(kpis.length, 4) as 1 | 2 | 3 | 4}>
          {kpis.slice(0, 4).map((kpi, idx) => (
            <KpiCard
              key={idx}
              label={kpi.label}
              value={kpi.value}
              trend={kpi.trend}
              subtext={kpi.subtext}
              icon={kpi.icon}
              variant={kpi.variant || "blue"}
              active={kpi.active}
              onClick={kpi.onClick}
            />
          ))}
        </DnaKpiGrid>
      )}

      {/* ── 3. CARD TABEL MASTER DENGAN TOOLBAR TERPADU ── */}
      <TableWrapper
        filters={
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 w-full">
            {/* Search + 2-Tier Filter + Date Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchVal}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-slate-50 dark:bg-[#0c1322] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 h-9 text-[12px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:bg-white dark:focus:bg-[#101726] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              {/* 2-Tier Dynamic Column Filter */}
              {columnFilterOptions &&
                columnFilterOptions.length > 0 &&
                controlledColId &&
                setControlledColId &&
                controlledColVal !== undefined &&
                setControlledColVal && (
                  <DnaColumnFilter
                    columns={columnFilterOptions}
                    selectedColumnId={controlledColId}
                    onColumnChange={setControlledColId}
                    filterValue={controlledColVal}
                    onValueChange={setControlledColVal}
                  />
                )}

              {/* Date Filter (Per Bulan / Rentang) */}
              {controlledDateFilter && setControlledDateFilter && (
                <DnaDateFilter
                  value={controlledDateFilter}
                  onChange={setControlledDateFilter}
                />
              )}

              {/* Reset Filter Button */}
              {isFilterActive && onResetFilters && (
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="h-9 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-semibold transition-all border-none cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" />
                  <span>Reset</span>
                </button>
              )}

              {extraToolbarActions}
            </div>

            {/* Tombol Aksi Utama Halaman (Sebelah Kanan Toolbar) */}
            {primaryAction && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={primaryAction.onClick}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs dark:shadow-[0_0_12px_rgba(37,99,235,0.3)] h-9 border-none"
                >
                  <PrimaryIcon className="w-4 h-4" />
                  <span>{primaryAction.label}</span>
                </button>
              </div>
            )}
          </div>
        }
        pagination={
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-200 dark:border-slate-800 select-none">
            <div>
              Menampilkan {totalItems === 0 ? 0 : (validPage - 1) * pageSize + 1}–
              {Math.min(validPage * pageSize, totalItems)} dari {totalItems} data
            </div>
            <div className="flex items-center gap-3">
              {/* Rows Per Page Selector */}
              <div className="flex items-center gap-1.5">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-md px-2 py-1 cursor-pointer focus:outline-none"
                >
                  {pageSizeOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                      {opt} / page
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={validPage <= 1}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer border-none bg-transparent"
                  title="Halaman Pertama"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validPage <= 1}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer border-none bg-transparent"
                  title="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 font-semibold text-slate-800 dark:text-slate-200">
                  {validPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validPage >= totalPages}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer border-none bg-transparent"
                  title="Halaman Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={validPage >= totalPages}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer border-none bg-transparent"
                  title="Halaman Terakhir"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        }
      >
        <DnaTable>
          <DnaTableHead>
            <DnaTableRow>
              {/* Checkbox Header */}
              {selectable && (
                <DnaTh className="w-10 pl-6 text-center">
                  <input
                    type="checkbox"
                    checked={
                      controlledSelectedIds?.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={controlledOnSelectAll}
                    className="rounded-xs border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </DnaTh>
              )}

              {/* Columns Headers */}
              {columns.map((col) => {
                const sKey = (col.sortKey || col.key) as keyof T;
                return (
                  <DnaTh
                    key={col.key}
                    align={col.align || "left"}
                    sortable={col.sortable}
                    sortDirection={sortConfig.key === sKey ? sortConfig.direction : null}
                    onSort={col.sortable ? () => handleSort(sKey) : undefined}
                    className={cn(
                      col.type === "index" && "w-8 text-center",
                      col.minWidth ? `min-w-[${col.minWidth}px]` : undefined,
                      col.className
                    )}
                  >
                    {col.label}
                  </DnaTh>
                );
              })}

              {/* Actions Header */}
              {rowActions && (
                <DnaTh align="center" className="pr-6 whitespace-nowrap">
                  AKSI
                </DnaTh>
              )}
            </DnaTableRow>
          </DnaTableHead>

          <DnaTableBody>
            {isLoading ? (
              <DnaTableRow>
                <DnaTd colSpan={totalColSpan} align="center" className="py-16 text-slate-400">
                  <div className="flex flex-col items-center gap-2 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <p className="font-bold text-xs text-slate-500">Memuat data operasional...</p>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : paginatedData.length === 0 ? (
              <DnaTableRow>
                <DnaTd colSpan={totalColSpan} align="center" className="py-16 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="font-bold text-xs text-slate-600 dark:text-slate-300">
                      {emptyStateMessage}
                    </p>
                    <p className="text-[11px] text-slate-400">{emptyStateDescription}</p>
                  </div>
                </DnaTd>
              </DnaTableRow>
            ) : (
              paginatedData.map((row, rowIdx) => {
                const rKey = rowKey(row, rowIdx);
                const isSelected = controlledSelectedIds?.includes(rKey);

                return (
                  <DnaTableRow
                    key={rKey}
                    className={cn(isSelected && "bg-blue-50/30 dark:bg-blue-950/40")}
                  >
                    {/* Checkbox Cell */}
                    {selectable && (
                      <DnaTd className="pl-6 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => controlledOnSelectRow?.(rKey)}
                          className="rounded-xs border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </DnaTd>
                    )}

                    {/* Column Cells */}
                    {columns.map((col, colIdx) => {
                      const colKey = (col.key || col.accessorKey || col.id || `col-${colIdx}`) as string;
                      const rawVal = col.key ? (row as any)[col.key] : col.accessorKey ? (row as any)[col.accessorKey] : undefined;

                      // 1. Custom Cell or Render Function
                      if (col.cell) {
                        return (
                          <DnaTd
                            key={colKey}
                            align={col.align}
                            className={cn(col.className)}
                          >
                            {col.cell(row, (validPage - 1) * pageSize + rowIdx)}
                          </DnaTd>
                        );
                      }

                      if (col.render) {
                        return (
                          <DnaTd
                            key={colKey}
                            align={col.align}
                            className={cn(col.className)}
                          >
                            {col.render(rawVal ?? row, row, (validPage - 1) * pageSize + rowIdx)}
                          </DnaTd>
                        );
                      }

                      // 2. Index (#) Type
                      if (col.type === "index") {
                        return (
                          <DnaTd
                            key={colKey}
                            align="center"
                            className="text-[11px] font-medium text-slate-400 select-none whitespace-nowrap"
                          >
                            {(validPage - 1) * pageSize + rowIdx + 1}
                          </DnaTd>
                        );
                      }

                      // 3. Code Type (e.g. WO, PR, PO)
                      if (col.type === "code") {
                        return (
                          <DnaTd key={colKey} className="whitespace-nowrap">
                            {col.codeOnClick ? (
                              <button
                                type="button"
                                onClick={() => col.codeOnClick!(row)}
                                className="hover:underline text-left cursor-pointer font-mono font-bold text-blue-600 dark:text-blue-400 border-none bg-transparent p-0"
                              >
                                {String(rawVal || "-")}
                              </button>
                            ) : (
                              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {String(rawVal || "-")}
                              </span>
                            )}
                          </DnaTd>
                        );
                      }

                      // 4. Primary Entity (e.g. Product Name)
                      if (col.type === "primary") {
                        return (
                          <DnaTd
                            key={colKey}
                            className={cn("min-w-[170px] max-w-[260px]", col.className)}
                          >
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block leading-snug">
                              {String(rawVal || "-")}
                            </span>
                          </DnaTd>
                        );
                      }

                      // 5. Secondary Entity (e.g. Client, Supplier)
                      if (col.type === "secondary") {
                        return (
                          <DnaTd key={colKey} className="min-w-[130px] whitespace-nowrap">
                            <span className="font-medium text-slate-700 dark:text-slate-300 text-xs block">
                              {String(rawVal || "-")}
                            </span>
                          </DnaTd>
                        );
                      }

                      // 6. Status / Badge Type (Title Case, Kiri Kata Kanan Panah)
                      if (col.type === "status" || col.type === "badge") {
                        const sMap = col.statusMap || {};
                        const badgeInfo = sMap[String(rawVal)] || {
                          label: String(rawVal),
                          badgeStatus: "default" as const,
                        };

                        return (
                          <DnaTd key={colKey} align="center" className="whitespace-nowrap">
                            {col.onStatusChange && col.statusOptions ? (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    title="Klik untuk mengganti status"
                                    className={cn(
                                      "inline-flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap min-w-[125px] transition-all cursor-pointer select-none",
                                      badgeInfo.badgeStatus === "emerald" &&
                                        "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
                                      badgeInfo.badgeStatus === "amber" &&
                                        "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40",
                                      badgeInfo.badgeStatus === "blue" &&
                                        "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40",
                                      badgeInfo.badgeStatus === "rose" &&
                                        "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40",
                                      badgeInfo.badgeStatus === "purple" &&
                                        "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40",
                                      badgeInfo.badgeStatus === "default" &&
                                        "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                  >
                                    <span>{badgeInfo.label}</span>
                                    <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="center"
                                  className="w-48 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 rounded-xl z-50 text-slate-800 dark:text-slate-100"
                                >
                                  <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                                    Ganti Status Dokumen
                                  </DropdownMenuLabel>
                                  <DropdownMenuSeparator className="dark:bg-slate-800" />
                                  {col.statusOptions.map((stOpt) => {
                                    const isCurrent = rawVal === stOpt.value;
                                    return (
                                      <DropdownMenuItem
                                        key={stOpt.value}
                                        onClick={() => col.onStatusChange!(row, stOpt.value)}
                                        className={cn(
                                          "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors",
                                          isCurrent
                                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                                        )}
                                      >
                                        <span>{stOpt.label}</span>
                                        {isCurrent && (
                                          <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                        )}
                                      </DropdownMenuItem>
                                    );
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            ) : (
                              <span
                                className={cn(
                                  "inline-flex items-center justify-between gap-2 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap min-w-[125px]",
                                  badgeInfo.badgeStatus === "emerald" &&
                                    "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
                                  badgeInfo.badgeStatus === "amber" &&
                                    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
                                  badgeInfo.badgeStatus === "blue" &&
                                    "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
                                  badgeInfo.badgeStatus === "rose" &&
                                    "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300",
                                  badgeInfo.badgeStatus === "purple" &&
                                    "bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300",
                                  badgeInfo.badgeStatus === "default" &&
                                    "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
                                )}
                              >
                                <span>{badgeInfo.label}</span>
                              </span>
                            )}
                          </DnaTd>
                        );
                      }

                      // 7. Progress Type
                      if (col.type === "progress") {
                        return (
                          <DnaTd key={colKey} className="min-w-[130px] whitespace-nowrap">
                            <DnaProgress value={Number(rawVal) || 0} />
                          </DnaTd>
                        );
                      }

                      // 8. Avatar / PIC Type
                      if (col.type === "avatar") {
                        const nameStr = String(rawVal || "-");
                        const initialChar = nameStr.charAt(0).toUpperCase() || "?";
                        return (
                          <DnaTd key={colKey} className="whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                {initialChar}
                              </div>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {nameStr}
                              </span>
                            </div>
                          </DnaTd>
                        );
                      }

                      // 9. Number / Qty Type
                      if (col.type === "number") {
                        return (
                          <DnaTdNumber
                            key={colKey}
                            value={Number(rawVal) || 0}
                            className="whitespace-nowrap"
                          />
                        );
                      }

                      // 10. Currency (Rp) Type
                      if (col.type === "currency") {
                        return (
                          <DnaTdNumber
                            key={colKey}
                            value={Number(rawVal) || 0}
                            prefix="Rp "
                            className="whitespace-nowrap font-bold text-slate-900 dark:text-slate-100"
                          />
                        );
                      }

                      // 11. Date Type
                      if (col.type === "date") {
                        return (
                          <DnaTd key={colKey} className="whitespace-nowrap">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {String(rawVal || "-")}
                            </span>
                          </DnaTd>
                        );
                      }

                      // 12. Notes Type
                      if (col.type === "notes") {
                        const notesStr = String(rawVal || "-");
                        return (
                          <DnaTd key={colKey} className="min-w-[140px]">
                            <span
                              className="text-xs text-slate-500 dark:text-slate-400 max-w-[180px] truncate block"
                              title={notesStr}
                            >
                              {notesStr}
                            </span>
                          </DnaTd>
                        );
                      }

                      // Default Text
                      return (
                        <DnaTd key={colKey} align={col.align}>
                          <span className="text-xs text-slate-800 dark:text-slate-200">
                            {String(rawVal !== undefined && rawVal !== null ? rawVal : "-")}
                          </span>
                        </DnaTd>
                      );
                    })}

                    {/* Row Actions Cell */}
                    {rowActions && (
                      <DnaTd align="center" className="pr-6 whitespace-nowrap">
                        <DnaTableRowActions
                          {...(typeof rowActions === "function"
                            ? rowActions(row, (validPage - 1) * pageSize + rowIdx)
                            : {
                                onView: rowActions.onView ? () => rowActions.onView!(row) : undefined,
                                onEdit: rowActions.onEdit ? () => rowActions.onEdit!(row) : undefined,
                                onDelete: rowActions.onDelete ? () => rowActions.onDelete!(row) : undefined,
                                onPrint: rowActions.onPrint ? () => rowActions.onPrint!(row) : undefined,
                                extraActions: rowActions.extraActions ? rowActions.extraActions(row) : undefined,
                              })}
                        />
                      </DnaTd>
                    )}
                  </DnaTableRow>
                );
              })
            )}
          </DnaTableBody>
        </DnaTable>
      </TableWrapper>

      {/* Optional Modals / Drawers passed as children */}
      {children}
    </DnaPageContainer>
  );
}
