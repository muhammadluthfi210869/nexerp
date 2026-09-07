"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DnaTableToolbar, DnaTableToolbarProps } from "./DnaTableToolbar";
import { DnaPagination, DnaPaginationProps } from "./DnaPagination";

export interface DnaDataTableCardProps {
  children: React.ReactNode;
  toolbarProps?: DnaTableToolbarProps;
  customToolbar?: React.ReactNode;
  paginationProps?: DnaPaginationProps;
  customPagination?: React.ReactNode;
  className?: string;
  tableContainerClassName?: string;
}

export function DnaDataTableCard({
  children,
  toolbarProps,
  customToolbar,
  paginationProps,
  customPagination,
  className,
  tableContainerClassName,
}: DnaDataTableCardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all",
        className
      )}
    >
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
