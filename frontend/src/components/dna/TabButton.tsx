"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface TabButtonProps {
  id: string
  label: string
  icon: React.ElementType
  isActive: boolean
  onClick: () => void
  className?: string
}

export function TabButton({ id, label, icon: Icon, isActive, onClick, className }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
        isActive
          ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  )
}

interface TabButtonGroupProps {
  tabs: Array<{ id: string; label: string; icon: React.ElementType }>
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
}

export function TabButtonGroup({ tabs, activeTab, onTabChange, className }: TabButtonGroupProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          id={tab.id}
          label={tab.label}
          icon={tab.icon}
          isActive={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
        />
      ))}
    </div>
  )
}
