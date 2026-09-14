"use client";

import React from "react";
import { FolderOpen, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaEmptyStateProps {
  title?: string;
  description?: string;
  actionButton?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function DnaEmptyState({
  title = "Belum Ada Data",
  description = "Tidak ada catatan yang ditemukan untuk filter atau kategori ini.",
  actionButton,
  icon,
  className,
}: DnaEmptyStateProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-12 text-center space-y-3 shadow-2xs",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        {icon ?? <FolderOpen className="w-6 h-6" />}
      </div>
      <h4 className="font-bold text-[16px] text-slate-900">{title}</h4>
      <p className="text-[12px] text-slate-500 max-w-sm mx-auto">{description}</p>
      {actionButton && <div className="pt-2">{actionButton}</div>}
    </div>
  );
}

export interface DnaLoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function DnaLoadingSkeleton({ rows = 4, className }: DnaLoadingSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-2xs animate-pulse",
        className
      )}
    >
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-100 rounded-lg w-full" />
        ))}
      </div>
    </div>
  );
}

export interface DnaErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function DnaErrorState({
  title = "Gagal Memuat Data",
  message = "Terjadi kesalahan saat menghubungi server. Silakan coba lagi.",
  onRetry,
  className,
}: DnaErrorStateProps) {
  return (
    <div
      className={cn(
        "bg-rose-50 border border-rose-200 rounded-xl p-5 flex items-start justify-between gap-4 text-rose-900 shadow-2xs",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="font-bold text-[14px]">{title}</h4>
          <p className="text-[12px] text-rose-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-8 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[12px] font-semibold border-none cursor-pointer shrink-0 flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Coba Lagi
        </button>
      )}
    </div>
  );
}
