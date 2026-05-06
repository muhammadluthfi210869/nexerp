import React from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standardized table wrapper that enforces consistent row heights,
 * cell padding, and header styling across ALL ERP tables.
 */
export function DataTable({ children, className }: DataTableProps) {
  return (
    <div 
      className={cn("bg-white border border-border shadow-sm overflow-hidden", className)}
      style={{ borderRadius: 'var(--card-radius)' }}
    >
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

interface DataTableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTableHead({ children, className }: DataTableHeadProps) {
  return (
    <thead className={cn("bg-[#F9FAFB] border-b border-gray-100", className)}>
      <tr className="hover:bg-transparent">
        {children}
      </tr>
    </thead>
  );
}

interface DataTableThProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export function DataTableTh({ children, align = "left", className }: DataTableThProps) {
  return (
    <th
      className={cn(
        "text-[10px] font-extrabold text-slate-500 uppercase tracking-tight",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      style={{
        padding: `0 var(--table-cell-px)`,
        height: 'var(--table-header-h)',
      }}
    >
      {children}
    </th>
  );
}

interface DataTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function DataTableRow({ children, className, onClick }: DataTableRowProps) {
  return (
    <tr 
      onClick={onClick}
      className={cn("hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-0", className)}
    >
      {children}
    </tr>
  );
}

interface DataTableCellProps {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  colSpan?: number;
}

export function DataTableCell({ children, align = "left", className, colSpan }: DataTableCellProps) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "align-middle",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
      style={{
        padding: `0 var(--table-cell-px)`,
        height: 'var(--table-row-h)',
      }}
    >
      {children}
    </td>
  );
}

interface DataTableBodyProps {
  children: React.ReactNode;
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return (
    <tbody className="divide-y divide-slate-50">
      {children}
    </tbody>
  );
}

