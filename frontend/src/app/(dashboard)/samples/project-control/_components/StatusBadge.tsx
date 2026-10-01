"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "../_types/project-control.types";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ON_TRACK: "bg-emerald-50 text-emerald-700 border-emerald-200",
    AT_RISK: "bg-amber-50 text-amber-800 border-amber-200",
    ON_HOLD: "bg-slate-100 text-slate-600 border-slate-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    PLANNED: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      )}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}
