import React from "react";
import { cn } from "@/lib/utils";

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
  return (
    <div 
      className={cn("bg-white border border-border rounded-xl shadow-xs overflow-hidden", className)}
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
  return <thead className={cn("bg-slate-50/50", className)}>{children}</thead>;
}

const resolveAlignClass = (align?: "left" | "center" | "right") => {
  if (align === "center") return "text-center";
  if (align === "right") return "text-right";
  return "";
};

interface DataTableThProps {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}

export function DataTableTh({ children, className, align = "left" }: DataTableThProps) {
  return (
    <th
      className={cn(
        "text-xs font-bold text-slate-400 uppercase tracking-wider px-4 h-12",
        resolveAlignClass(align),
        className
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
        "py-3.5 px-4 font-mono text-xs text-slate-900 border-b border-slate-50/80",
        resolveAlignClass(align),
        className
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
  return (
    <tbody className="divide-y divide-slate-50">
      {children}
    </tbody>
  );
}
