"use client";

import * as React from "react";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * DnaEmptyState — replaces shadcn empty-state. Composes DnaCard internally for
 * visual consistency. Variants: default | muted. Action slot is ReactNode.
 */

export interface DnaEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  variant?: "default" | "muted" | "card";
  className?: string;
}

const variantClasses = {
  default: "bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm",
  muted: "bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 shadow-none",
  card: "bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200 dark:border-slate-800 shadow-md",
} as const;

export const DnaEmptyState: React.FC<DnaEmptyStateProps> = ({
  title = "Belum Ada Data",
  description = "Tidak ada catatan yang ditemukan untuk filter atau kategori ini.",
  icon,
  action,
  variant = "default",
  className,
}) => (
  <div
    className={cn(
      "rounded-2xl p-12 text-center space-y-3",
      variantClasses[variant],
      className
    )}
  >
    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
      {icon ?? <FolderOpen className="w-6 h-6" />}
    </div>
    <h4 className="font-bold text-[16px] text-slate-900 dark:text-slate-100">{title}</h4>
    <p className="text-[12px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
      {description}
    </p>
    {action && <div className="pt-2 flex justify-center">{action}</div>}
  </div>
);

export default DnaEmptyState;