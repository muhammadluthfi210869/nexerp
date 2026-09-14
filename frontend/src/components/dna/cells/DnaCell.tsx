"use client";

import React from "react";
import { Eye, Edit3, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ── 1. CODE CELL (WO, PO, SKU, No Referensi) ──
export interface DnaCellCodeProps {
  value?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  subtitle?: string;
}

export function DnaCellCode({ value, children, onClick, className, subtitle }: DnaCellCodeProps) {
  const displayVal = children !== undefined ? children : value;
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        onClick={onClick}
        className={cn(
          "font-mono font-semibold text-[11.5px] tracking-tight transition-colors",
          onClick
            ? "text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
            : "text-slate-800"
        )}
      >
        {displayVal}
      </span>
      {subtitle && (
        <span className="text-[10px] text-slate-400 font-normal">
          {subtitle}
        </span>
      )}
    </div>
  );
}

// ── 2. TEXT CELL (Nama Produk / Entitas, wrap ke bawah tanpa elipsis) ──
export interface DnaCellTextProps {
  primary: string;
  secondary?: string;
  className?: string;
  maxWidth?: string;
}

export function DnaCellText({ primary, secondary, className, maxWidth }: DnaCellTextProps) {
  return (
    <div className={cn("flex flex-col min-w-0 break-words whitespace-normal leading-tight", maxWidth || "max-w-[280px]", className)}>
      <span className="text-[12px] font-medium text-slate-900 leading-snug">
        {primary}
      </span>
      {secondary && (
        <span className="text-[10.5px] text-slate-400 mt-0.5">
          {secondary}
        </span>
      )}
    </div>
  );
}

export interface DnaCellBadgeProps {
  status?: string;
  label?: string;
  className?: string;
}

export function formatStatusTitleCase(status: string): string {
  if (!status) return "";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getStatusBadgeStyle(status: string): string {
  const normalized = (status || "").toLowerCase().replace(/_/g, " ");
  if (normalized.includes("finish") || normalized.includes("selesai") || normalized.includes("approved") || normalized.includes("lunas") || normalized.includes("pkp") || normalized.includes("active")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (normalized.includes("mix") || normalized.includes("progress") || normalized.includes("proses") || normalized.includes("bbk") || normalized.includes("info")) {
    return "bg-sky-50 text-sky-700 border-sky-200/80";
  }
  if (normalized.includes("wait") || normalized.includes("tunggu") || normalized.includes("material") || normalized.includes("hold") || normalized.includes("kemasan")) {
    return "bg-amber-50 text-amber-800 border-amber-200/80";
  }
  if (normalized.includes("pending") || normalized.includes("review") || normalized.includes("draft")) {
    return "bg-orange-50 text-orange-800 border-orange-200/80";
  }
  if (normalized.includes("cancel") || normalized.includes("reject") || normalized.includes("batal") || normalized.includes("gagal") || normalized.includes("non")) {
    return "bg-rose-50 text-rose-700 border-rose-200/80";
  }
  return "bg-slate-50 text-slate-700 border-slate-200/80";
}

export function DnaCellBadge({ status, label, className }: DnaCellBadgeProps) {
  const actualStatus = status || label || "";
  const displayLabel = label || formatStatusTitleCase(actualStatus);
  const styleClass = getStatusBadgeStyle(actualStatus);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs whitespace-nowrap",
        styleClass,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}

// ── 4. PROGRESS CELL (Line bar + persentase, strictly no "batch" text) ──
export interface DnaCellProgressProps {
  value: number; // 0 - 100
  colorClass?: string;
  className?: string;
}

export function DnaCellProgress({ value, colorClass = "bg-blue-600", className }: DnaCellProgressProps) {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className={cn("flex items-center gap-2.5 min-w-[110px]", className)}>
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-300", colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[11px] font-semibold text-slate-700 tabular-nums w-8 text-right shrink-0">
        {clamped}%
      </span>
    </div>
  );
}

// ── 5. AVATAR CELL (Inisial Bulat + Nama PIC/Klien) ──
export interface DnaCellAvatarProps {
  name: string;
  subtext?: string;
  initial?: string;
  avatarBg?: string;
  className?: string;
}

export function DnaCellAvatar({
  name,
  subtext,
  initial,
  avatarBg = "bg-slate-100 text-slate-700",
  className,
}: DnaCellAvatarProps) {
  const displayInitial = initial || (name ? name.charAt(0).toUpperCase() : "?");
  return (
    <div className={cn("flex items-center gap-2 min-w-0", className)}>
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-bold shrink-0 border border-slate-200/60 shadow-2xs",
          avatarBg
        )}
      >
        {displayInitial}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[12px] font-medium text-slate-800 truncate max-w-[180px]">
          {name}
        </span>
        {subtext && (
          <span className="text-[10.5px] text-slate-400 font-mono truncate max-w-[180px]">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}

// ── 6. NUMBER CELL (Kuantitas, Qty, Target dengan tabular-nums rata kanan) ──
export interface DnaCellNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function DnaCellNumber({ value, suffix, className }: DnaCellNumberProps) {
  return (
    <div className={cn("text-right tabular-nums text-[12px] font-medium text-slate-700", className)}>
      <span>{value.toLocaleString("id-ID")}</span>
      {suffix && <span className="text-[10px] text-slate-400 ml-1 font-normal">{suffix}</span>}
    </div>
  );
}

// ── 7. CURRENCY CELL (Nilai Rupiah 1 Baris, whitespace-nowrap tabular-nums rata kanan) ──
export interface DnaCellCurrencyProps {
  value: number;
  prefix?: string;
  className?: string;
}

export function DnaCellCurrency({ value, prefix = "Rp", className }: DnaCellCurrencyProps) {
  return (
    <div
      className={cn(
        "text-right tabular-nums text-[12px] font-semibold text-slate-900 whitespace-nowrap",
        className
      )}
    >
      <span className="text-[10.5px] font-medium text-slate-400 mr-1">{prefix}</span>
      <span>{value.toLocaleString("id-ID")}</span>
    </div>
  );
}

// ── 8. DATE CELL (Tanggal & Waktu) ──
export interface DnaCellDateProps {
  value: string;
  className?: string;
}

export function DnaCellDate({ value, className }: DnaCellDateProps) {
  return (
    <span className={cn("text-[11px] text-slate-500 whitespace-nowrap", className)}>
      {value}
    </span>
  );
}

// ── 9. ACTIONS CELL (Tombol CRUD Minimalis: View, Edit, Delete) ──
export interface DnaCellActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  extraActions?: React.ReactNode;
  className?: string;
}

export function DnaCellActions({
  onView,
  onEdit,
  onDelete,
  viewTitle = "Lihat Detail",
  editTitle = "Ubah Data",
  deleteTitle = "Hapus Data",
  extraActions,
  className,
}: DnaCellActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-1 shrink-0", className)}>
      {onView && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          title={viewTitle}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          title={editTitle}
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border-none bg-transparent cursor-pointer"
          title={deleteTitle}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      {extraActions}
    </div>
  );
}

// ── EXPORT AS A NAMESPACED OBJECT ──
export const DnaCell = {
  Code: DnaCellCode,
  code: DnaCellCode,
  Text: DnaCellText,
  text: DnaCellText,
  Badge: DnaCellBadge,
  badge: DnaCellBadge,
  Status: DnaCellBadge,
  status: DnaCellBadge,
  Progress: DnaCellProgress,
  progress: DnaCellProgress,
  Avatar: DnaCellAvatar,
  avatar: DnaCellAvatar,
  Number: DnaCellNumber,
  number: DnaCellNumber,
  Currency: DnaCellCurrency,
  currency: DnaCellCurrency,
  Date: DnaCellDate,
  date: DnaCellDate,
  Actions: DnaCellActions,
  actions: DnaCellActions,
};
