import React from "react";
import { cn } from "@/lib/utils";

interface DataTableV2Props extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

export function DataTableV2({ children, className, minWidth = "720px", ...props }: DataTableV2Props) {
  return (
    <div className="data-table-v2" data-table-version="v2">
      <div className="data-table-v2-scroll" tabIndex={0} aria-label="Scrollable data table">
        <table {...props} className={cn("data-table-v2-table", className)} style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableV2Toolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("data-table-v2-toolbar", className)}>{children}</div>;
}

export function DataTableV2Head({ children, className }: { children: React.ReactNode; className?: string }) {
  return <thead className={cn("data-table-v2-head", className)}>{children}</thead>;
}

export function DataTableV2HeaderCell({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <th className={cn("data-table-v2-header-cell", align === "center" && "text-center", align === "right" && "text-right", className)}>
      {children}
    </th>
  );
}

export function DataTableV2Body({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn("data-table-v2-body", className)}>{children}</tbody>;
}

export function DataTableV2Row({ children, className, onClick, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr {...props} onClick={onClick} className={cn("data-table-v2-row", onClick && "cursor-pointer", className)}>
      {children}
    </tr>
  );
}

export function DataTableV2Cell({
  children,
  align = "left",
  className,
  colSpan,
}: {
  children: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={cn("data-table-v2-cell", align === "center" && "text-center", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}
