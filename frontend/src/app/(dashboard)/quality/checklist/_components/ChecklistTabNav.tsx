"use client";

import React from "react";
import { ListTodo, Settings, Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChecklistActiveTab } from "../_types";

interface ChecklistTabNavProps {
  activeTab: ChecklistActiveTab;
  onTabChange: (tab: ChecklistActiveTab) => void;
  checklistCount: number;
  categoryCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ChecklistTabNav({
  activeTab,
  onTabChange,
  checklistCount,
  categoryCount,
  searchQuery,
  onSearchChange,
}: ChecklistTabNavProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
      <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
        <button
          type="button"
          onClick={() => onTabChange("checklist")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "checklist" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900",
          )}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Checklist Operasional</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 tabular-nums">{checklistCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("category")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "category" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900",
          )}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Kategori Checklist</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 tabular-nums">{categoryCount}</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("manage")}
          className={cn(
            "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
            activeTab === "manage" ? "bg-white text-slate-900 shadow-2xs font-extrabold" : "text-slate-600 hover:text-slate-900",
          )}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Kelola Checklist SO</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-700 tabular-nums">{checklistCount}</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari dalam tab aktif..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 w-60 placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}
