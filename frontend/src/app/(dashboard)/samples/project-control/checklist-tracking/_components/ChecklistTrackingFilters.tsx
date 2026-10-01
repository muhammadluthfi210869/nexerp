"use client";

import React from "react";
import { User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabFilter, ChecklistCounts } from "../_types/checklist-tracking.types";

interface ChecklistTrackingFiltersProps {
  tabFilter: TabFilter;
  setTabFilter: (tab: TabFilter) => void;
  picFilter: string;
  setPicFilter: (pic: string) => void;
  picOptions: string[];
  counts: ChecklistCounts;
  onReset: () => void;
  setPage: (page: number) => void;
}

export function ChecklistTrackingFilters({
  tabFilter,
  setTabFilter,
  picFilter,
  setPicFilter,
  picOptions,
  counts,
  onReset,
  setPage,
}: ChecklistTrackingFiltersProps) {
  const tabs: { key: TabFilter; label: string }[] = [
    { key: "ALL", label: `Semua (${counts.all})` },
    { key: "ON_TRACK", label: `On Track (${counts.onTrack})` },
    { key: "PENDING_APPROVAL", label: `Menunggu Approval (${counts.pending})` },
    { key: "OVERDUE", label: `Lewat Deadline (${counts.overdue})` },
  ];

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
      <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setTabFilter(tab.key);
              setPage(1);
            }}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              tabFilter === tab.key
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Filter PIC:</span>
          <select
            value={picFilter}
            onChange={(e) => {
              setPicFilter(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">Semua PIC</option>
            {picOptions.map((pic) => (
              <option key={pic} value={pic}>
                {pic}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="h-8 px-2.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
