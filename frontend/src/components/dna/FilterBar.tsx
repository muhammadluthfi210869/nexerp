"use client"

import React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { DnaInput } from "./DnaInput"

interface FilterBarProps {
  searchValue?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  platformValue?: string
  onPlatformChange?: (value: string) => void
  platformOptions?: Array<{ value: string; label: string }>
  statusValue?: string
  onStatusChange?: (value: string) => void
  statusOptions?: Array<{ value: string; label: string }>
  className?: string
}

export function FilterBar({
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
  platformValue = "",
  onPlatformChange,
  platformOptions = [],
  statusValue = "",
  onStatusChange,
  statusOptions = [],
  className,
}: FilterBarProps) {
  const hasFilters = platformOptions.length > 0 || statusOptions.length > 0

  return (
    <div className={cn("flex flex-col sm:flex-row items-stretch sm:items-center gap-3", className)}>
      {onSearchChange && (
        <DnaInput
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          icon={<Search />}
          className="sm:max-w-64"
        />
      )}

      {hasFilters && (
        <div className="flex items-center gap-2">
          {platformOptions.length > 0 && onPlatformChange && (
            <select
              value={platformValue}
              onChange={(e) => onPlatformChange(e.target.value)}
              className="h-11 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Platforms</option>
              {platformOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}

          {statusOptions.length > 0 && onStatusChange && (
            <select
              value={statusValue}
              onChange={(e) => onStatusChange(e.target.value)}
              className="h-11 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Status</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  )
}
