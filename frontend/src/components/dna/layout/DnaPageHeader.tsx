"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DnaPageTabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface DnaPageHeaderProps {
  title: string;
  titleAccent?: string;
  subtitle?: string;
  description?: string;
  backLink?: {
    href: string;
    label: string;
  };
  backHref?: string;
  backText?: string;
  badge?: React.ReactNode;
  breadcrumbs?: any[];
  breadcrumbItems?: any[];
  tabs?: DnaPageTabItem[];
  activeTab?: string;
  onTabChange?: (tabKey: string) => void;
  showThemeToggle?: boolean;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  extraActions?: React.ReactNode;
  action?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function DnaPageHeader({
  title,
  titleAccent,
  subtitle,
  description,
  backLink,
  backHref,
  backText,
  badge,
  breadcrumbs,
  tabs,
  activeTab,
  onTabChange,
  showThemeToggle = false,
  isDarkMode = false,
  onToggleTheme,
  extraActions,
  action,
  actions,
  className,
}: DnaPageHeaderProps) {
  const effectiveBackLink = backLink || (backHref ? { href: backHref, label: backText || "Kembali" } : undefined);
  const effectiveSubtitle = subtitle || description;
  const rightActions = action || actions || extraActions;
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none",
        className
      )}
    >
      {/* Left: Back Link & H1 Title */}
      <div>
        {effectiveBackLink && (
          <Link
            href={effectiveBackLink.href}
            className="text-[12px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-decoration-none mb-1 w-fit transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {effectiveBackLink.label}
          </Link>
        )}
        <h1 className="text-[26px] md:text-[28px] font-black text-slate-900 tracking-tight uppercase">
          {title} {titleAccent && <span className="text-amber-500 font-serif lowercase italic font-normal ml-1.5">{titleAccent}</span>}
        </h1>
        {effectiveSubtitle && (
          <p className="text-[12px] text-slate-500 mt-0.5">
            {effectiveSubtitle}
          </p>
        )}
      </div>

      {/* Right: Segmented Tabs, Theme Toggle & Extra Actions */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {tabs && tabs.length > 0 && onTabChange && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs flex items-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={cn(
                    "h-8 px-3.5 rounded-lg text-[12px] transition-all flex items-center gap-2 cursor-pointer border-none font-semibold",
                    isActive
                      ? "bg-blue-600 text-white shadow-2xs"
                      : "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded text-[10px] font-bold",
                        isActive ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {showThemeToggle && (
          <button
            type="button"
            onClick={onToggleTheme}
            className="h-10 px-2.5 bg-white border border-slate-200/90 rounded-xl text-slate-400 hover:text-slate-600 shadow-2xs flex items-center gap-1 cursor-pointer"
            title="Toggle theme"
          >
            <Sun className={cn("w-3.5 h-3.5", !isDarkMode ? "text-amber-500" : "text-slate-300")} />
            <Moon className={cn("w-3.5 h-3.5", isDarkMode ? "text-blue-500" : "text-slate-400")} />
          </button>
        )}

        {rightActions}
      </div>
    </div>
  );
}
