"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { DnaTableToolbar, DnaTableToolbarProps } from "./DnaTableToolbar";
import { DnaPagination, DnaPaginationProps } from "./DnaPagination";

export interface DnaDataTableCardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  count?: number;
  totalItems?: number;
  icon?: any;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  toolbarProps?: DnaTableToolbarProps;
  customToolbar?: React.ReactNode;
  paginationProps?: DnaPaginationProps;
  customPagination?: React.ReactNode;
  className?: string;
  tableContainerClassName?: string;
}

export function DnaDataTableCard({
  children,
  title,
  description,
  count,
  totalItems,
  icon,
  badge,
  actions,
  searchPlaceholder = "Cari data...",
  searchValue,
  onSearchChange,
  toolbarProps,
  customToolbar,
  paginationProps,
  customPagination,
  className,
  tableContainerClassName,
}: DnaDataTableCardProps) {
  const displayCount = count !== undefined ? count : totalItems;

  return (
    <div
      className={cn(
        "bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all",
        className
      )}
    >
      {/* 0. TITLE & SEARCH HEADER (When direct props are used) */}
      {(title || badge || actions || onSearchChange) && (
        <div className="px-5 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
          <div>
            <div className="flex items-center gap-2">
              {title && <h3 className="text-[14px] font-bold text-slate-800">{title}</h3>}
              {displayCount !== undefined && (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {displayCount}
                </span>
              )}
              {badge}
            </div>
            {description && (
              <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSearchChange && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/50 w-48 sm:w-64"
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      )}

      {/* 1. TOOLBAR AREA */}
      {customToolbar ? (
        customToolbar
      ) : toolbarProps ? (
        <DnaTableToolbar {...toolbarProps} />
      ) : null}

      {/* 2. TABLE / CONTENT AREA */}
      <div className={cn("overflow-x-auto", tableContainerClassName)}>
        {children}
      </div>

      {/* 3. PAGINATION AREA */}
      {customPagination ? (
        customPagination
      ) : paginationProps ? (
        <DnaPagination {...paginationProps} />
      ) : null}
    </div>
  );
}
