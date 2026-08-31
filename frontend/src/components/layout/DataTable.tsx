"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Canonical-aligned DataTable primitives.
 * All match canonical visual grammar:
 * - 12px outer radius
 * - subtle 1px neutral border
 * - 42px header height
 * - 44px row height
 * - 11px uppercase headers with subtle slate-50 surface
 */

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div
      className={cn(
        "rounded-[12px] border border-[#E2E8F0] bg-white overflow-hidden",
        className,
      )}
    >
      <table className="w-full text-left border-collapse text-[13px]">
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
  return <thead className={cn("bg-slate-50/70", className)}>{children}</thead>;
}

interface DataTableThProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTableTh({ children, className, align = "left" }: DataTableThProps) {
  return (
    <th
      className={cn(
        "h-[42px] px-4 text-[11px] font-semibold text-slate-500 uppercase tracking-wider",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
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
      className={cn(
        "border-b border-[#E2E8F0] last:border-b-0 hover:bg-slate-50/50 transition-colors",
        className,
      )}
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
        "h-[44px] px-4 text-[13px] text-slate-700 align-middle",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className,
      )}
    >
      {children}
    </td>
  );
}

interface DataTableBodyProps {
  children: React.ReactNode;
}

export function DataTableBody({ children }: DataTableBodyProps) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}
