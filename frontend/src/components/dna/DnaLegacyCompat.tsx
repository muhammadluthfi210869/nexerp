"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 1. Page Container ──
export function DnaPageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6 pb-20 text-slate-900 bg-[#F8FAFC] min-h-screen", className)}>
      {children}
    </div>
  );
}

// ── 2. Table Primitives ──
export function DnaTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <table className={cn("w-full text-left border-collapse text-[12px]", className)}>{children}</table>;
}

export function DnaTableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead className={cn("border-b border-slate-200 bg-slate-50/75 text-slate-600 text-[11px] font-bold tracking-wider select-none", className)}>
      {children}
    </thead>
  );
}

export function DnaTh({
  children,
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn("p-3.5 text-left font-bold text-slate-600 text-[11px]", className)} {...props}>
      {children}
    </th>
  );
}

export function DnaTableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tbody className={cn("divide-y divide-slate-100", className)}>{children}</tbody>;
}

export function DnaTableRow({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("hover:bg-slate-50/80 transition-colors", className)} {...props}>
      {children}
    </tr>
  );
}

export function DnaTd({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("p-3.5 text-slate-700 text-[12px]", className)} {...props}>
      {children}
    </td>
  );
}

export function DnaTdNumber({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("p-3.5 text-right tabular-nums text-slate-900 font-mono text-[12px]", className)} {...props}>
      {children}
    </td>
  );
}

export function DnaTdCode({
  children,
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn("p-3.5 font-mono text-[11.5px] text-blue-600 font-semibold", className)} {...props}>
      {children}
    </td>
  );
}

// ── 3. Modal ──
export function DnaModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-2xl",
  size,
  footer,
  className,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  size?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  if (isOpen === false) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div
        className={cn(
          "bg-white dark:bg-[#0c1322] rounded-xl shadow-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col",
          maxWidth,
          className
        )}
      >
        {(title || onClose) && (
          <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div>
              {title && <h3 className="font-bold text-slate-900 text-[15px]">{title}</h3>}
              {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ── 4. Drawer ──
export function DnaDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  badge,
  children,
  size = "md",
  footer,
  className,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  badge?: any;
  children: React.ReactNode;
  size?: string;
  footer?: React.ReactNode;
  className?: string;
}) {
  if (isOpen === false) return null;

  const widthClass = size === "lg" ? "max-w-2xl" : size === "xl" ? "max-w-4xl" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-200">
      <div
        className={cn(
          "bg-white dark:bg-[#0c1322] w-full h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200",
          widthClass,
          className
        )}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">{title || "Detail"}</h3>
              {badge && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 border-none bg-transparent cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 5. Tab Nav & Item ──
export interface DnaTabItem {
  id?: string;
  label?: string;
  icon?: any;
  key?: string;
  count?: number;
  badge?: any;
}

export function DnaTabNav({
  tabs,
  activeTab,
  onChange,
  variant,
  children,
  className,
}: {
  tabs?: DnaTabItem[];
  activeTab?: string;
  onChange?: (id: any) => void;
  variant?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  if (tabs && tabs.length > 0) {
    return (
      <div className={cn("flex items-center gap-1.5 border-b border-slate-200 pb-2", className)}>
        {tabs.map((t) => {
          const tabKey = t.id || t.key || "";
          const isActive = activeTab === tabKey;
          const Icon = t.icon;
          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => onChange && onChange(tabKey)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border-none cursor-pointer flex items-center gap-2",
                isActive
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              )}
            >
              {Icon && (typeof Icon === "function" ? <Icon className="w-3.5 h-3.5" /> : Icon)}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 border-b border-slate-200 pb-2", className)}>
      {children}
    </div>
  );
}

export function DnaTabItem({
  active,
  onClick,
  children,
  className,
}: {
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all border-none cursor-pointer",
        active
          ? "bg-blue-600 text-white shadow-2xs"
          : "bg-transparent text-slate-600 hover:bg-slate-100",
        className
      )}
    >
      {children}
    </button>
  );
}

export type DnaKpiItem = any;
export type DnaColumnDef<T = any> = any;
export type DnaColumn<T = any> = any;
export type DateFilterValue = any;

// ── 6. Form Controls ──
export function DnaToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  actionButton,
  children,
  className,
}: {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  actionButton?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3", className)}>
      {searchPlaceholder && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue || ""}
          onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
          className="h-9 px-3.5 bg-slate-50 border border-slate-200/90 rounded-xl text-[12px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
      )}
      {children}
      {actionButton}
    </div>
  );
}

export function DnaEmptyState({
  title = "Tidak ada data",
  description = "Belum ada entri yang tercatat.",
  actionButton,
  className,
}: {
  title?: string;
  description?: string;
  actionButton?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("p-12 text-center text-slate-400 space-y-3", className)}>
      <p className="font-semibold text-slate-600 text-[13px]">{title}</p>
      <p className="text-[11px] mt-1">{description}</p>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
}

export function DnaSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function DnaTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500",
        className
      )}
      {...props}
    />
  );
}

export function DnaCheckbox({
  className,
  label,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  if (label) {
    return (
      <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer text-[12px] text-slate-700 select-none">
        <input
          id={id}
          type="checkbox"
          className={cn("rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer", className)}
          {...props}
        />
        <span>{label}</span>
      </label>
    );
  }

  return (
    <input
      id={id}
      type="checkbox"
      className={cn("rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer", className)}
      {...props}
    />
  );
}

export function DnaAuditTimeline({
  items,
  entityId,
  compact,
  className,
}: {
  items?: { title: string; date: string; status?: string }[];
  entityId?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {items?.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3 text-[11.5px]">
          <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
          <div>
            <span className="font-medium text-slate-800">{item.title}</span>
            <span className="text-[10px] text-slate-400 block">{item.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
