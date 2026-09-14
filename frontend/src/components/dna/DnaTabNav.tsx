"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface DnaTabItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  count?: string | number;
}

export type DnaTabItemType = DnaTabItem;


export interface DnaTabNavProps {
  tabs: DnaTabItem[];
  activeTab: string;
  onChange?: (tabId: string) => void;
  onTabChange?: (tabId: string) => void;
  className?: string;
  size?: "default" | "sm";
  variant?: "default" | "header";
}

/**
 * Bordered Tab Navigation Container (Section 07 of Visual DNA)
 * Default Height: 46px | Header/Compact Height: 38px
 * Active Tab: Blue fill (#2563EB), text 12px, weight 600/700, radius 8px
 * Fully supports Light & Dark Mode.
 */
export function DnaTabNav({
  tabs,
  activeTab,
  onChange,
  onTabChange,
  className,
  size = "default",
  variant = "default",
}: DnaTabNavProps) {
  const isCompact = size === "sm" || variant === "header";
  const handleTabChange = onChange || onTabChange || (() => {});

  return (
    <div
      className={cn(
        "bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800/80 rounded-xl p-1 shadow-2xs flex items-center gap-1 overflow-x-auto",
        isCompact ? "h-auto" : "h-[46px]",
        className
      )}
    >
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "rounded-lg font-bold transition-all shrink-0 cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap",
              isCompact ? "px-3 py-1.5 text-xs" : "h-[38px] px-4 text-[12px]",
              isActive
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            {IconComponent && (
              React.isValidElement(IconComponent) ? (
                IconComponent
              ) : (
                React.createElement(IconComponent as any, {
                  className: cn(isCompact ? "w-3.5 h-3.5" : "w-4 h-4", isActive ? "text-white" : "text-slate-400"),
                })
              )
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "text-[10px] font-extrabold px-1.5 py-0.2 rounded-full",
                  isActive
                    ? "bg-blue-700/80 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
