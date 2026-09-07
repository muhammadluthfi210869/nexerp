"use client";

import React from "react";
import { Eye, Printer, Edit3, MoreHorizontal, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface DnaExtraAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

export interface DnaTableRowActionsProps {
  onView?: () => void;
  viewTitle?: string;
  onPrint?: () => void;
  printTitle?: string;
  onEdit?: () => void;
  editTitle?: string;
  onDelete?: () => void;
  deleteTitle?: string;
  extraActions?: DnaExtraAction[];
  menuLabel?: string;
  className?: string;
  showDirectDelete?: boolean;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CANONICAL DNA TABLE ROW ACTIONS (Visual DNA Enterprise Standard)
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a unified, ergonomic action button suite for data tables:
 * - Subtle Ghost Buttons (View, Print, Edit) with soft hover tones
 * - Optional Overflow Dropdown Menu (...) for secondary actions and deletion
 * - Prevents loud, over-saturated solid button blocks across table rows
 * - Fully supports Light & Dark Mode
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function DnaTableRowActions({
  onView,
  viewTitle = "Lihat Detail",
  onPrint,
  printTitle = "Cetak Dokumen",
  onEdit,
  editTitle = "Edit Dokumen",
  onDelete,
  deleteTitle = "Hapus Dokumen",
  extraActions = [],
  menuLabel = "Aksi Dokumen",
  className,
  showDirectDelete = false,
}: DnaTableRowActionsProps) {
  const hasDropdown = extraActions.length > 0 || (onDelete && !showDirectDelete);

  return (
    <div className={cn("inline-flex items-center gap-1 select-none", className)}>
      {/* 1. VIEW / DETAIL BUTTON */}
      {onView && (
        <button
          type="button"
          onClick={onView}
          title={viewTitle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 2. PRINT BUTTON */}
      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          title={printTitle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 3. EDIT BUTTON */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title={editTitle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:text-slate-400 dark:hover:text-amber-400 dark:hover:bg-amber-950/50 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 4. DIRECT DELETE BUTTON (OPTIONAL) */}
      {onDelete && showDirectDelete && (
        <button
          type="button"
          onClick={onDelete}
          title={deleteTitle}
          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer border-none bg-transparent"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* 5. OVERFLOW MENU (...) FOR SECONDARY ACTIONS */}
      {hasDropdown && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title="Aksi Lainnya"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer border-none bg-transparent"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xl p-1 rounded-xl z-50 text-slate-800 dark:text-slate-100"
          >
            {menuLabel && (
              <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                {menuLabel}
              </DropdownMenuLabel>
            )}
            {menuLabel && <DropdownMenuSeparator className="dark:bg-slate-800" />}

            {extraActions.map((action, idx) => {
              const Icon = action.icon;
              const isDanger = action.variant === "danger";
              return (
                <DropdownMenuItem
                  key={idx}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors",
                    isDanger
                      ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              );
            })}

            {onDelete && !showDirectDelete && (
              <>
                {extraActions.length > 0 && <DropdownMenuSeparator className="dark:bg-slate-800" />}
                <DropdownMenuItem
                  onClick={onDelete}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/60 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>{deleteTitle}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
