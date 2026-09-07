"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaPageHeaderProps {
  title: string;
  backHref?: string;
  backText?: string;
  onBackClick?: () => void;
  className?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  subtitle?: React.ReactNode;
  tabs?: React.ReactNode;
}

/**
 * Un-boxed Operational Page Header according to Visual DNA specs.
 * Consists of optional small back link + Bold Page Title + Top-Right Nav Tabs / Actions.
 * Fully supports Light & Dark Mode.
 */
export function DnaPageHeader({
  title,
  backHref,
  backText = "Kembali",
  onBackClick,
  className,
  badge,
  action,
  actions,
  subtitle,
  tabs,
}: DnaPageHeaderProps) {
  const effectiveAction = action || actions;

  return (
    <div className={cn("space-y-1", className)}>
      {onBackClick ? (
        <button
          type="button"
          onClick={onBackClick}
          className="text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 text-decoration-none mb-1 w-fit transition-colors bg-transparent border-none p-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {backText}
        </button>
      ) : backHref ? (
        <Link
          href={backHref}
          className="text-[12px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 text-decoration-none mb-1 w-fit transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {backText}
        </Link>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] sm:text-[30px] leading-[34px] sm:leading-[38px] font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              {subtitle}
            </p>
          )}
        </div>
        {(tabs || effectiveAction) && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {tabs}
            {effectiveAction}
          </div>
        )}
      </div>
    </div>
  );
}
