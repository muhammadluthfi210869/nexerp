"use client";

import React from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CANONICAL DNA TABLE SYSTEM (World-Class Enterprise Standard)
 * ─────────────────────────────────────────────────────────────────────────────
 * Guaranteed properties:
 * 1. 100% Pure Inter Sans (No monospaced typewriter / no slashed zeros 'Ø')
 * 2. Automatic Tabular Figures ('tabular-nums') on numeric columns
 * 3. Exact 42px row height and 40px thead height
 * 4. Text hierarchy (Primary 900 / Secondary 600)
 * 5. Native Light & Dark Mode Support
 * 6. Interactive Column Sorting (ASC/DESC) & In-Header Column Filtering
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface DnaTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
}

export function DnaTable({ children, className, ...props }: DnaTableProps) {
  return (
    <table className={cn("w-full text-left border-collapse", className)} {...props}>
      {children}
    </table>
  );
}

export function DnaTableHead({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "bg-slate-50/90 dark:bg-[#111827]/90 border-b border-slate-200 dark:border-slate-800 text-[11px] leading-[16px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 h-[40px]",
        className
      )}
      {...props}
    >
      {children}
    </thead>
  );
}

export interface DnaThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sortDirection?: "asc" | "desc" | null;
  onSort?: () => void;
  filterOptions?: { label: string; value: string }[];
  filterValue?: string;
  onFilterChange?: (val: string) => void;
}

export function DnaTh({
  children,
  className,
  align = "left",
  sortable = false,
  sortDirection = null,
  onSort,
  filterOptions,
  filterValue,
  onFilterChange,
  ...props
}: DnaThProps) {
  const alignClasses =
    align === "center"
      ? "justify-center text-center"
      : align === "right"
      ? "justify-end text-right"
      : "justify-start text-left";

  const isFilterActive = filterValue && filterValue !== "ALL" && filterValue !== "Semua Status";

  return (
    <th
      className={cn(
        "py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      {...props}
    >
      <div className={cn("inline-flex items-center gap-1.5", alignClasses, sortable && "group")}>
        {sortable ? (
          <button
            type="button"
            onClick={onSort}
            className={cn(
              "inline-flex items-center gap-1 uppercase tracking-wider font-bold transition-colors cursor-pointer bg-transparent border-none p-0 text-inherit",
              sortDirection
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
            )}
          >
            <span>{children}</span>
            <span className="shrink-0 transition-transform">
              {sortDirection === "asc" ? (
                <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ) : sortDirection === "desc" ? (
                <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              ) : (
                <ChevronsUpDown className="w-3 h-3 text-slate-400/70 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
              )}
            </span>
          </button>
        ) : (
          <span>{children}</span>
        )}

        {filterOptions && filterOptions.length > 0 && (
          <div className="relative inline-flex items-center ml-1" onClick={(e) => e.stopPropagation()}>
            <select
              value={filterValue || "ALL"}
              onChange={(e) => onFilterChange?.(e.target.value)}
              className={cn(
                "text-[10px] font-bold py-0.5 px-1 rounded border transition-colors cursor-pointer focus:outline-none",
                isFilterActive
                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                  : "bg-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent hover:border-slate-300 dark:hover:border-slate-700"
              )}
              title="Filter kolom"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </th>
  );
}

export function DnaTableBody({ children, className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("divide-y divide-slate-100 dark:divide-slate-800/80 text-[12px] leading-[18px]", className)} {...props}>
      {children}
    </tbody>
  );
}

export interface DnaTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  isSelected?: boolean;
}

export function DnaTableRow({ children, className, isSelected, ...props }: DnaTableRowProps) {
  return (
    <tr
      className={cn(
        "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors h-[42px]",
        isSelected && "bg-blue-50/30 dark:bg-blue-950/40",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export interface DnaTdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  isPrimary?: boolean;
  isMuted?: boolean;
}

export function DnaTd({ children, className, align = "left", isPrimary, isMuted, ...props }: DnaTdProps) {
  return (
    <td
      className={cn(
        "py-2 px-3.5 text-[12px]",
        isPrimary ? "font-semibold text-slate-900 dark:text-slate-100" : isMuted ? "text-slate-600 dark:text-slate-400 font-normal" : "text-slate-800 dark:text-slate-200 font-medium",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

export interface DnaTdNumberProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  value?: number | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  children?: React.ReactNode;
  align?: "left" | "center" | "right";
}

/**
 * Tabular Numeric Cell (Amounts, Currency, Quantities)
 * Uses pure Inter Sans with tabular-nums for vertical decimal alignment without typewriter mono.
 */
export function DnaTdNumber({
  value,
  prefix,
  suffix,
  decimals,
  children,
  className,
  align = "right",
  ...props
}: DnaTdNumberProps) {
  const formattedValue =
    typeof value === "number"
      ? decimals !== undefined
        ? value.toLocaleString("id-ID", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Number.isInteger(value)
        ? value.toLocaleString("id-ID")
        : value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;

  const content =
    children !== undefined
      ? children
      : `${prefix || ""}${formattedValue !== undefined ? formattedValue : ""}${suffix || ""}`;

  return (
    <td
      className={cn(
        "py-2 px-3.5 font-semibold text-slate-800 dark:text-slate-200 tabular-nums text-xs",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
        className
      )}
      {...props}
    >
      {content}
    </td>
  );
}

/**
 * Interactive Document / SKU Code Link
 */
export interface DnaTdCodeProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  code?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

export function DnaTdCode({ code, children, onClick, className, ...props }: DnaTdCodeProps) {
  const content = children || code;
  return (
    <td className={cn("py-2 px-3.5 text-[12px]", className)} {...props}>
      {onClick ? (
        <button
          onClick={onClick}
          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-left border-none bg-transparent cursor-pointer transition-colors"
        >
          {content}
        </button>
      ) : (
        <span className="font-semibold text-blue-600 dark:text-blue-400">{content}</span>
      )}
    </td>
  );
}

export interface DnaEmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  actionButton?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function DnaEmptyState({
  title = "Tidak ada data ditemukan",
  description = "Coba ubah kata kunci pencarian atau filter yang aktif.",
  actionText,
  onAction,
  actionButton,
  icon,
  className,
}: DnaEmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{description}</p>
      {actionButton && <div className="mt-4">{actionButton}</div>}
      {actionText && onAction && !actionButton && (
        <button
          onClick={onAction}
          className="mt-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all border-none"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}

export interface DnaLoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function DnaLoadingSkeleton({ rows = 5, className }: DnaLoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export const DNA_TABLE_CLASSES = {
  table: "w-full text-left border-collapse",
  thead: "bg-slate-50/90 dark:bg-[#111827]/90 border-b border-slate-200 dark:border-slate-800 text-[11px] leading-[16px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 h-[40px]",
  tbody: "divide-y divide-slate-100 dark:divide-slate-800/80 text-[12px] leading-[18px]",
  th: "py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none",
  thCenter: "py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none text-center",
  thRight: "py-2.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none text-right",
  tr: "border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors h-[42px]",
  td: "py-2 px-3.5 text-xs text-slate-700 dark:text-slate-300 align-middle",
  tdMuted: "py-2 px-3.5 text-xs text-slate-500 dark:text-slate-400 align-middle",
  tdCenter: "py-2 px-3.5 text-xs text-slate-700 dark:text-slate-300 align-middle text-center",
  tdRight: "py-2 px-3.5 text-xs text-slate-700 dark:text-slate-300 align-middle text-right font-medium tabular-nums",
};


